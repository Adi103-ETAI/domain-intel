"""
Database Models for DomainIntel

SQLAlchemy ORM models for persisting scan history and other data.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from datetime import datetime
from app.db.base import Base


class ScanHistory(Base):
    """
    Stores history of all domain scans performed.
    
    This enables:
    - Historical tracking of investigations
    - Analytics on scanned domains
    - Audit trail for law enforcement
    """
    __tablename__ = "scan_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    domain = Column(String(255), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(10), nullable=False)  # LOW, MEDIUM, HIGH
    confidence = Column(String(10), nullable=True)   # low, medium, high
    scan_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    pdf_path = Column(String(500), nullable=True)
    
    # Additional useful fields
    analyst_name = Column(String(255), nullable=True)
    case_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # Supports IPv6
    country_code = Column(String(5), nullable=True)
    
    def __repr__(self):
        return f"<ScanHistory(id={self.id}, domain='{self.domain}', risk_level='{self.risk_level}')>"
