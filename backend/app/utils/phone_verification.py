from datetime import datetime, timedelta, timezone
import logging
import os
import secrets
import string
from sqlalchemy.orm import Session
from twilio.rest import Client
from app.models.phone_verification import PhoneVerificationCode

logger = logging.getLogger(__name__)

CODE_TTL_MINUTES = 10
MAX_VERIFICATION_ATTEMPTS = 5


def _generate_code() -> str:
    return "".join(secrets.choice(string.digits) for _ in range(6))


def send_verification_sms(phone_number: str, db: Session) -> bool:
    """Generate, persist, and send an SMS verification code."""
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
    env = os.getenv("ENV", "").lower()

    code = _generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MINUTES)

    # Replace any previous pending code for this phone number
    db.query(PhoneVerificationCode).filter(
        PhoneVerificationCode.phone_number == phone_number
    ).delete()
    db.add(
        PhoneVerificationCode(
            phone_number=phone_number,
            code=code,
            attempts=0,
            expires_at=expires_at,
        )
    )
    db.commit()

    if not all([twilio_sid, twilio_token, twilio_from]):
        if env in ("development", "test"):
            logger.info("Dev SMS verification code generated for %s", phone_number)
            return True
        logger.warning("Twilio is not configured in production; cannot send SMS.")
        return False

    try:
        client = Client(twilio_sid, twilio_token)
        client.messages.create(
            body=f"Your Trade Me verification code is: {code}",
            from_=twilio_from,
            to=phone_number,
        )
        return True
    except Exception as e:
        logger.error("Error sending SMS via Twilio: %s", e)
        return False


def verify_sms_code(phone_number: str, code: str, db: Session) -> bool:
    """Verify a stored SMS code with expiry and brute-force attempt limits."""
    record = (
        db.query(PhoneVerificationCode)
        .filter(PhoneVerificationCode.phone_number == phone_number)
        .order_by(PhoneVerificationCode.created_at.desc())
        .first()
    )
    if not record:
        return False

    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at or record.attempts >= MAX_VERIFICATION_ATTEMPTS:
        db.delete(record)
        db.commit()
        return False

    if secrets.compare_digest(record.code, code):
        db.delete(record)
        db.commit()
        return True

    record.attempts += 1
    db.commit()
    return False
