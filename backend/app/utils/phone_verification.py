import os
from twilio.rest import Client
import random
import string

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# In-memory storage for verification codes (use Redis in production)
verification_codes = {}


def send_verification_sms(phone_number: str) -> bool:
    """Send SMS verification code"""
    try:
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
            # For development, just store a mock code
            code = ''.join(random.choices(string.digits, k=6))
            verification_codes[phone_number] = code
            print(
                f"Mock SMS sent to {phone_number}: Your verification code is {code}")
            return True

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        code = ''.join(random.choices(string.digits, k=6))
        verification_codes[phone_number] = code

        message = client.messages.create(
            body=f"Your Trade Me verification code is: {code}",
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        return True
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False


def verify_sms_code(phone_number: str, code: str) -> bool:
    """Verify SMS code"""
    stored_code = verification_codes.get(phone_number)
    if stored_code and stored_code == code:
        # Remove code after successful verification
        del verification_codes[phone_number]
        return True
    return False
