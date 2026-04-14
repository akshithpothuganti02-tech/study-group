import os
import requests
from functools import lru_cache
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError

# ── Configuration ──────────────────────────────────────────────────────────────
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.environ.get("VITE_COGNITO_USER_POOL_ID", "")
COGNITO_CLIENT_ID = os.environ.get("VITE_COGNITO_CLIENT_ID", "")

COGNITO_JWKS_URL = (
    f"https://cognito-idp.{AWS_REGION}.amazonaws.com"
    f"/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
)

security = HTTPBearer()

@lru_cache(maxsize=1)
def get_cognito_jwks() -> dict:
    """Cache the JWKS public keys from Cognito so we don't fetch on every request."""
    try:
        resp = requests.get(COGNITO_JWKS_URL, timeout=5)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch Cognito JWKS: {e}")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Validates the Cognito JWT from the Authorization: Bearer <token> header.
    Extracts the user's sub (userId) and email from verified token claims.
    Raises 401 for any invalid, expired, or tampered token.
    """
    token = credentials.credentials
    
    try:
        # 1. Fetch cached public keys from Cognito
        jwks = get_cognito_jwks()

        # 2. Decode and verify the JWT signature against Cognito public keys
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=COGNITO_CLIENT_ID,
            options={"verify_exp": True}
        )

        # 3. Confirm this is an ID token (not an access token)
        if claims.get("token_use") not in ("id", "access"):
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = claims.get("sub")
        email = claims.get("email", f"{user_id}@unknown.com")

        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing sub claim")

        return {"id": user_id, "email": email}

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please sign in again.")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
