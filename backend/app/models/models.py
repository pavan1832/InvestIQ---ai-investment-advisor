import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Text, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    portfolios: Mapped[list["Portfolio"]] = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(500))
    total_value: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    diversification_score: Mapped[float] = mapped_column(Float, default=0.0)
    holdings: Mapped[dict | None] = mapped_column(JSONB)
    sector_distribution: Mapped[dict | None] = mapped_column(JSONB)
    asset_allocation: Mapped[dict | None] = mapped_column(JSONB)
    ai_insights: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="portfolios")
    history: Mapped[list["PortfolioHistory"]] = relationship("PortfolioHistory", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioHistory(Base):
    __tablename__ = "portfolio_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_value: Mapped[float | None] = mapped_column(Float)
    risk_score: Mapped[float | None] = mapped_column(Float)
    diversification_score: Mapped[float | None] = mapped_column(Float)
    snapshot_date: Mapped[datetime] = mapped_column(Date, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="history")
