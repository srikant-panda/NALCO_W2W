import enum
from datetime import datetime
from uuid import UUID,uuid4
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Boolean, DateTime, String,Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Role(str, enum.Enum):
    NALCO_ADMIN = "NALCO_ADMIN"
    BUYER = "BUYER"
    LOGISTICS = "LOGISTICS"
    AUDITOR = "AUDITOR"


class User(TimestampMixin, Base):
    __tablename__ = "profiles"
    id: Mapped[Uuid] = mapped_column(Uuid, primary_key=True, default=uuid4, index=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[Role] = mapped_column(SAEnum(Role, name="role"), default=Role.BUYER.value)
    company_id: Mapped[str | None] = mapped_column("companyId", String(36), nullable=True)
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True, server_default="true")
    refresh_token_hash: Mapped[str | None] = mapped_column("refreshTokenHash", String(128), nullable=True)
    refresh_token_expires_at: Mapped[datetime | None] = mapped_column(
        "refreshTokenExpiresAt", DateTime(timezone=True), nullable=True
    )
