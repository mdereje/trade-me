import hashlib
import hmac
import json
import os
import sys
import time

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["ENV"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fastapi.testclient import TestClient  # noqa: E402
import stripe  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


def _sign_stripe_payload(payload_bytes: bytes, secret: str) -> str:
    timestamp = str(int(time.time()))
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    sig = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig}"


def _register(email: str, username: str):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "username": username,
            "full_name": username.title(),
            "password": "Password123!",
            "city": "Seattle",
            "state": "WA",
            "zip_code": "98101",
        },
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_public_plans_endpoint():
    resp = client.get("/api/payments/plans")
    assert resp.status_code == 200
    body = resp.json()
    plans_by_id = {p["id"]: p for p in body["plans"]}
    assert plans_by_id["monthly"]["price_cents"] == 99
    assert plans_by_id["annual"]["price_cents"] == 1000
    assert plans_by_id["annual"]["highlighted"] is True


def test_freemium_gating_and_stripe_lifecycle(monkeypatch):
    webhook_secret = "whsec_test_secret_123"
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_live_mock_key")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", webhook_secret)
    monkeypatch.setenv("STRIPE_PRICE_MONTHLY_ID", "price_monthly_99")
    monkeypatch.setenv("STRIPE_PRICE_ANNUAL_ID", "price_annual_1000")
    monkeypatch.setenv("FRONTEND_URL", "https://trade-me-13f73.web.app")

    cats = client.get("/api/items/categories").json()
    cat_id = cats[0]["id"]

    u1 = _register("freeuser1@example.com", "freeuser1")
    u2 = _register("freeuser2@example.com", "freeuser2")
    h1 = {"Authorization": f"Bearer {u1['access_token']}"}
    h2 = {"Authorization": f"Bearer {u2['access_token']}"}

    # Initial status is cleanly unsubscribed (200, not 404)
    st = client.get("/api/payments/status", headers=h1)
    assert st.status_code == 200
    assert st.json()["is_active"] is False
    assert st.json()["status"] == "none"

    # Free user CAN list 1 item
    item1 = client.post(
        "/api/items/",
        headers=h1,
        json={
            "title": "Free First Item",
            "description": "First listing is free",
            "condition": "Good",
            "category_id": cat_id,
            "zip_code": "98101",
            "city": "Seattle",
            "state": "WA",
        },
    )
    assert item1.status_code == 200, item1.text
    item2 = client.post(
        "/api/items/",
        headers=h2,
        json={
            "title": "Other User Item",
            "description": "Listed by user 2",
            "condition": "Good",
            "category_id": cat_id,
            "zip_code": "98101",
            "city": "Seattle",
            "state": "WA",
        },
    )
    assert item2.status_code == 200

    # Free user hits 402 on 2nd active item
    second_item = client.post(
        "/api/items/",
        headers=h1,
        json={
            "title": "Second Item Blocked",
            "description": "Requires membership",
            "condition": "Good",
            "category_id": cat_id,
            "zip_code": "98101",
            "city": "Seattle",
            "state": "WA",
        },
    )
    assert second_item.status_code == 402
    assert second_item.json()["detail"]["code"] == "SUBSCRIPTION_REQUIRED"

    # Free user hits 402 when making a trade offer
    blocked_offer = client.post(
        "/api/trades/offers",
        headers=h1,
        json={"item_id": item2.json()["id"], "offered_item_id": item1.json()["id"]},
    )
    assert blocked_offer.status_code == 402

    # Mock Stripe Customer, Checkout Session, and Portal Session creation
    monkeypatch.setattr(
        stripe.Customer, "create", lambda **kwargs: {"id": "cus_billing_1"}
    )
    captured_checkout = {}

    def _fake_checkout_create(**kwargs):
        captured_checkout.update(kwargs)
        return {"id": "cs_test_123", "url": "https://checkout.stripe.com/pay/cs_test_123"}

    monkeypatch.setattr(stripe.checkout.Session, "create", _fake_checkout_create)
    monkeypatch.setattr(
        stripe.billing_portal.Session,
        "create",
        lambda **kwargs: {"url": "https://billing.stripe.com/session/bps_123"},
    )

    checkout_resp = client.post(
        "/api/payments/checkout", headers=h1, json={"plan": "annual"}
    )
    assert checkout_resp.status_code == 200, checkout_resp.text
    assert checkout_resp.json()["checkout_url"] == "https://checkout.stripe.com/pay/cs_test_123"
    assert captured_checkout["line_items"] == [{"price": "price_annual_1000", "quantity": 1}]
    assert captured_checkout["allow_promotion_codes"] is True

    # Invalid webhook signature is rejected
    bad_wh = client.post(
        "/api/payments/webhook/stripe",
        content=b"{}",
        headers={"Stripe-Signature": "t=1,v1=invalid"},
    )
    assert bad_wh.status_code == 400

    # Valid signed customer.subscription.created webhook activates user 1
    now_ts = int(time.time())
    sub_event = {
        "id": "evt_sub_created_1",
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "id": "sub_live_1",
                "customer": "cus_billing_1",
                "status": "active",
                "current_period_start": now_ts,
                "current_period_end": now_ts + 365 * 86400,
                "cancel_at_period_end": False,
                "metadata": {"user_id": str(u1["user"]["id"]), "plan": "annual"},
                "items": {"data": [{"price": {"id": "price_annual_1000"}}]},
            }
        },
    }
    raw_sub = json.dumps(sub_event).encode("utf-8")
    sig = _sign_stripe_payload(raw_sub, webhook_secret)

    wh_ok = client.post(
        "/api/payments/webhook/stripe",
        content=raw_sub,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )
    assert wh_ok.status_code == 200, wh_ok.text
    assert wh_ok.json()["status"] == "processed"

    # Replaying the exact same event ID is idempotent
    wh_dup = client.post(
        "/api/payments/webhook/stripe",
        content=raw_sub,
        headers={"Stripe-Signature": sig, "Content-Type": "application/json"},
    )
    assert wh_dup.status_code == 200
    assert wh_dup.json()["status"] == "duplicate"

    # User 1 is now active -> status, 2nd item, trade offer, and billing portal all succeed!
    st_active = client.get("/api/payments/status", headers=h1).json()
    assert st_active["is_active"] is True
    assert st_active["plan_type"] == "annual"
    assert st_active["amount_cents"] == 1000

    second_item_ok = client.post(
        "/api/items/",
        headers=h1,
        json={
            "title": "Second Item Unlocked",
            "description": "Now allowed with membership",
            "condition": "Like New",
            "category_id": cat_id,
            "zip_code": "98101",
            "city": "Seattle",
            "state": "WA",
        },
    )
    assert second_item_ok.status_code == 200

    offer_ok = client.post(
        "/api/trades/offers",
        headers=h1,
        json={"item_id": item2.json()["id"], "offered_item_id": item1.json()["id"]},
    )
    assert offer_ok.status_code == 200

    portal_resp = client.post("/api/payments/portal", headers=h1)
    assert portal_resp.status_code == 200
    assert portal_resp.json()["portal_url"].startswith("https://billing.stripe.com/")

    # Subscription deletion webhook revokes entitlement -> 402 again
    del_event = {
        "id": "evt_sub_deleted_1",
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": "sub_live_1",
                "customer": "cus_billing_1",
                "status": "canceled",
                "current_period_end": now_ts - 10,
                "metadata": {"user_id": str(u1["user"]["id"]), "plan": "annual"},
                "items": {"data": [{"price": {"id": "price_annual_1000"}}]},
            }
        },
    }
    raw_del = json.dumps(del_event).encode("utf-8")
    del_sig = _sign_stripe_payload(raw_del, webhook_secret)
    assert (
        client.post(
            "/api/payments/webhook/stripe",
            content=raw_del,
            headers={"Stripe-Signature": del_sig, "Content-Type": "application/json"},
        ).status_code
        == 200
    )

    assert client.get("/api/payments/status", headers=h1).json()["is_active"] is False
    assert (
        client.post(
            "/api/trades/offers",
            headers=h1,
            json={"item_id": item2.json()["id"], "offered_item_id": item1.json()["id"]},
        ).status_code
        == 402
    )
