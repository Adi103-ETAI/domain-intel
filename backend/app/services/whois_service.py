import whois
import requests
from typing import Dict, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class WHOISService:
    """
    WHOIS/RDAP data fetcher
    
    Tries multiple approaches:
    1. Free python-whois library (works for most domains)
    2. WhatIsMyIP.net free API (RDAP-based)
    3. Fallback to basic parsing
    """
    
    def __init__(self):
        self.whatismyip_api = settings.WHATISMYIP_WHOIS
    
    def get_whois_data(self, domain: str) -> Dict[str, Any]:
        """
        Fetch WHOIS data for domain
        
        Returns dict with:
        - registrar
        - creation_date
        - expiration_date
        - name_servers
        - status
        """
        try:
            # Method 1: Try python-whois library
            data = self._fetch_with_library(domain)
            if data:
                return data
            
            # Method 2: Try WhatIsMyIP API
            data = self._fetch_with_api(domain)
            if data:
                return data
            
            logger.warning(f"All WHOIS methods failed for {domain}")
            return {}
            
        except Exception as e:
            logger.error(f"WHOIS lookup failed for {domain}: {str(e)}")
            return {}
    
    def _fetch_with_library(self, domain: str) -> Optional[Dict[str, Any]]:
        """Fetch using python-whois library"""
        try:
            w = whois.whois(domain)
            
            if not w or not w.domain_name:
                return None
            
            return {
                'registrar': w.registrar,
                'creation_date': w.creation_date,
                'expiration_date': w.expiration_date,
                'updated_date': w.updated_date,
                'name_servers': w.name_servers,
                'status': w.status,
            }
        except Exception as e:
            logger.debug(f"Library method failed: {str(e)}")
            return None
    
    def _fetch_with_api(self, domain: str) -> Optional[Dict[str, Any]]:
        """Fetch using WhatIsMyIP.net API"""
        try:
            url = f"{self.whatismyip_api}?domain={domain}"
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            # Transform API response to standard format
            return {
                'registrar': data.get('registrar'),
                'creation_date': data.get('created'),
                'expiration_date': data.get('expires'),
                'updated_date': data.get('updated'),
                'name_servers': data.get('nameservers', []),
                'status': data.get('status', []),
            }
            
        except Exception as e:
            logger.debug(f"API method failed: {str(e)}")
            return None