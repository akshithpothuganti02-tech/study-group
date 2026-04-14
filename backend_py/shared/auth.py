from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

# For now, to unblock local testing without Cognito, we use mock headers.
# This can be replaced with python-jose validation of Cognito JWT later.
header_user_id = APIKeyHeader(name="X-User-Id", auto_error=False)
header_user_email = APIKeyHeader(name="X-User-Email", auto_error=False)

def get_current_user(
    user_id: str = Security(header_user_id),
    user_email: str = Security(header_user_email)
) -> dict:
    if not user_id:
        # In a real app with Cognito, we would parse the Authorization: Bearer <token>
        # and raise 401 if invalid.
        raise HTTPException(status_code=401, detail="Unauthorized - Missing X-User-Id header")
    return {"id": user_id, "email": user_email or f"{user_id}@example.com"}
