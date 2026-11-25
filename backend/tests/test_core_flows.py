import io
import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["ENV"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402

client = TestClient(app)


def _register_user(email: str, username: str, full_name: str, city: str = "Austin", state: str = "TX"):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "username": username,
            "full_name": full_name,
            "password": "Password123!",
            "city": city,
            "state": state,
            "zip_code": "78701",
        },
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_login_json_contract_and_duplicates():
    _register_user("alice@example.com", "alice_core", "Alice Trader")

    # Duplicate email and username return 400 (not 500)
    dup_email = client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "username": "alice_other",
            "full_name": "Alice Other",
            "password": "Password123!",
        },
    )
    assert dup_email.status_code == 400

    dup_user = client.post(
        "/api/auth/register",
        json={
            "email": "alice2@example.com",
            "username": "alice_core",
            "full_name": "Alice Other",
            "password": "Password123!",
        },
    )
    assert dup_user.status_code == 400

    # JSON login returns token AND user payload
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "Password123!"},
    )
    assert login_resp.status_code == 200, login_resp.text
    body = login_resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["username"] == "alice_core"

    # Bad password returns 401
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401


def test_public_browse_items_photos_trades_and_reviews(tmp_path, monkeypatch):
    monkeypatch.setenv("UPLOAD_DIR", str(tmp_path / "uploads"))
    monkeypatch.delenv("GCS_BUCKET_NAME", raising=False)

    # Categories are seeded and publicly readable without auth
    cats_resp = client.get("/api/items/categories")
    assert cats_resp.status_code == 200
    cats = cats_resp.json()
    assert len(cats) >= 6
    electronics_id = cats[0]["id"]
    furniture_id = cats[1]["id"]

    # Register two traders
    u1 = _register_user("trader1@example.com", "trader1", "Trader One", "Austin", "TX")
    u2 = _register_user("trader2@example.com", "trader2", "Trader Two", "Denver", "CO")
    h1 = {"Authorization": f"Bearer {u1['access_token']}"}
    h2 = {"Authorization": f"Bearer {u2['access_token']}"}

    # Create two items
    item1_resp = client.post(
        "/api/items/",
        headers=h1,
        json={
            "title": "Mechanical Keyboard",
            "description": "Tactile switches, great condition",
            "condition": "Like New",
            "category_id": electronics_id,
            "zip_code": "78701",
            "city": "Austin",
            "state": "TX",
            "latitude": 30.2672,
            "longitude": -97.7431,
        },
    )
    assert item1_resp.status_code == 200, item1_resp.text
    item1 = item1_resp.json()
    assert item1["owner"]["username"] == "trader1"

    item2_resp = client.post(
        "/api/items/",
        headers=h2,
        json={
            "title": "Mid-Century Lamp",
            "description": "Warm brass desk lamp",
            "condition": "Good",
            "category_id": furniture_id,
            "zip_code": "80202",
            "city": "Denver",
            "state": "CO",
            "latitude": 39.7392,
            "longitude": -104.9903,
        },
    )
    assert item2_resp.status_code == 200, item2_resp.text
    item2 = item2_resp.json()

    # Upload real photo to item1
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
    upload_resp = client.post(
        f"/api/items/{item1['id']}/photos",
        headers=h1,
        files=[("photos", ("keyboard.png", io.BytesIO(fake_png), "image/png"))],
    )
    assert upload_resp.status_code == 200, upload_resp.text
    photos = upload_resp.json()
    assert len(photos) == 1
    assert photos[0]["is_primary"] is True

    # Reject non-image uploads
    bad_upload = client.post(
        f"/api/items/{item1['id']}/photos",
        headers=h1,
        files=[("photos", ("bad.txt", io.BytesIO(b"hello"), "text/plain"))],
    )
    assert bad_upload.status_code == 400

    # Public browsing WITHOUT authentication works with search, category, location, and radius
    browse_all = client.get("/api/items/")
    assert browse_all.status_code == 200
    assert len(browse_all.json()) >= 2

    browse_search = client.get("/api/items/", params={"q": "Keyboard"})
    assert browse_search.status_code == 200
    assert [i["id"] for i in browse_search.json()] == [item1["id"]]

    browse_loc = client.get("/api/items/", params={"location": "Denver"})
    assert browse_loc.status_code == 200
    assert [i["id"] for i in browse_loc.json()] == [item2["id"]]

    browse_geo = client.get(
        "/api/items/",
        params={"latitude": 30.27, "longitude": -97.74, "radius": 25},
    )
    assert browse_geo.status_code == 200
    assert [i["id"] for i in browse_geo.json()] == [item1["id"]]

    detail = client.get(f"/api/items/{item1['id']}")
    assert detail.status_code == 200
    assert len(detail.json()["photos"]) == 1

    # Self-trade must be rejected
    self_offer = client.post(
        "/api/trades/offers",
        headers=h1,
        json={"item_id": item1["id"], "offered_item_id": item1["id"]},
    )
    assert self_offer.status_code == 400

    # Offering an item you do not own must be rejected (403)
    stolen_offer = client.post(
        "/api/trades/offers",
        headers=h2,
        json={"item_id": item2["id"], "offered_item_id": item1["id"]},
    )
    assert stolen_offer.status_code == 403

    # Valid trade offer: trader2 offers item2 for trader1's item1
    offer_resp = client.post(
        "/api/trades/offers",
        headers=h2,
        json={
            "item_id": item1["id"],
            "offered_item_id": item2["id"],
            "message": "Would love to swap my lamp for your keyboard!",
        },
    )
    assert offer_resp.status_code == 200, offer_resp.text
    offer = offer_resp.json()
    assert offer["item_owner_id"] == u1["user"]["id"]
    assert offer["status"] == "pending"

    # Trader1 sees it in received offers and accepts it
    received = client.get("/api/trades/offers/received", headers=h1)
    assert received.status_code == 200
    assert any(o["id"] == offer["id"] for o in received.json())

    accept_resp = client.post(f"/api/trades/offers/{offer['id']}/accept", headers=h1)
    assert accept_resp.status_code == 200, accept_resp.text
    trade = accept_resp.json()
    assert trade["status"] == "accepted"

    # Cannot review before trade is completed
    early_review = client.post(
        "/api/reviews/",
        headers=h1,
        json={
            "trade_id": trade["id"],
            "reviewee_id": u2["user"]["id"],
            "rating": 5,
            "title": "Too early",
        },
    )
    assert early_review.status_code == 400

    # Complete the trade -> marks both items traded and hides them from public browse
    complete_resp = client.post(f"/api/trades/{trade['id']}/complete", headers=h1)
    assert complete_resp.status_code == 200

    browse_after = client.get("/api/items/", params={"q": "Keyboard"})
    assert browse_after.status_code == 200
    assert browse_after.json() == []

    # Leave review after completion
    review_resp = client.post(
        "/api/reviews/",
        headers=h1,
        json={
            "trade_id": trade["id"],
            "reviewee_id": u2["user"]["id"],
            "rating": 5,
            "title": "Smooth swap!",
            "comment": "Item was exactly as described.",
        },
    )
    assert review_resp.status_code == 200, review_resp.text

    # Duplicate review rejected
    dup_review = client.post(
        "/api/reviews/",
        headers=h1,
        json={
            "trade_id": trade["id"],
            "reviewee_id": u2["user"]["id"],
            "rating": 4,
            "title": "Duplicate",
        },
    )
    assert dup_review.status_code == 400

    # Public profile stats reflect live DB counts
    u2_profile = client.get(f"/api/users/{u2['user']['id']}")
    assert u2_profile.status_code == 200
    stats = u2_profile.json()
    assert stats["trades_completed"] == 1
    assert stats["reviews_count"] == 1
    assert stats["average_rating"] == 5.0
