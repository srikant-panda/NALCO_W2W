from pydantic import BaseModel
from uuid import UUID

class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUser(BaseModel):
    id: UUID
    email: str | None = None
    name: str | None = None
    role: str | None = None
    companyId: str | None = None
    createdAt: str | None = None
    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy objects

class MeResponse(BaseModel):
    user: AuthUser
    tokenValid: bool


class LoginResponse(BaseModel):
    token: str
    tokenType: str
    expiresIn: int
    user: AuthUser
