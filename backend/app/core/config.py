from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application configuration"""
    
    # Application
    APP_NAME: str = "DomainIntel"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ]
    
    # API Keys (Optional - for premium APIs)
    WHOIS_API_KEY: str | None = None
    VIRUSTOTAL_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    
    # Database (Optional)
    DATABASE_URL: str = "sqlite:///./domainintel.db"
    
    # Report Settings
    REPORT_OUTPUT_DIR: str = "./reports"
    MAX_REPORT_AGE_DAYS: int = 30
    
    # Risk Thresholds
    DOMAIN_AGE_HIGH_RISK_DAYS: int = 7
    DOMAIN_AGE_MEDIUM_RISK_DAYS: int = 30
    
    # External API Endpoints
    IPWHOIS_API: str = "https://api.ipwhois.org/ip"
    WHATISMYIP_WHOIS: str = "https://www.whatismyip.net/whois/"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()