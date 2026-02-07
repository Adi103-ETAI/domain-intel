"""
DNS Resolution Service with Caching

Provides DNS lookups with LRU caching to avoid repeated network requests.
"""
import dns.resolver
import socket
from typing import List, Optional
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


class DNSService:
    """DNS resolution service with caching"""
    
    def __init__(self):
        self.resolver = dns.resolver.Resolver()
        self.resolver.timeout = 5
        self.resolver.lifetime = 5
    
    def resolve_domain(self, domain: str) -> Optional[str]:
        """
        Resolve domain to IP address (cached).
        
        Returns:
            Primary IP address or None
        """
        # Use cached function
        return _cached_resolve_domain(domain)
    
    def get_all_ips(self, domain: str) -> List[str]:
        """Get all IP addresses for domain (cached)"""
        return _cached_get_all_ips(domain)
    
    def get_nameservers(self, domain: str) -> List[str]:
        """Get nameservers for domain"""
        nameservers = []
        try:
            resolver = dns.resolver.Resolver()
            resolver.timeout = 5
            answers = resolver.resolve(domain, 'NS')
            nameservers = [str(answer).rstrip('.') for answer in answers]
        except Exception as e:
            logger.debug(f"Could not get nameservers for {domain}: {str(e)}")
        
        return nameservers
    
    def reverse_dns(self, ip: str) -> Optional[str]:
        """Reverse DNS lookup"""
        try:
            hostname = socket.gethostbyaddr(ip)
            return hostname[0]
        except Exception as e:
            logger.debug(f"Reverse DNS failed for {ip}: {str(e)}")
            return None


# =====================================================
# Cached Functions (module-level for lru_cache to work)
# =====================================================

@lru_cache(maxsize=128)
def _cached_resolve_domain(domain: str) -> Optional[str]:
    """
    Cached DNS resolution.
    
    LRU cache avoids repeated network requests for the same domain.
    Cache up to 128 domains.
    """
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5
        answers = resolver.resolve(domain, 'A')
        if answers:
            logger.info(f"DNS cache MISS for {domain}")
            return str(answers[0])
    except dns.resolver.NXDOMAIN:
        logger.warning(f"Domain {domain} does not exist")
    except dns.resolver.Timeout:
        logger.warning(f"DNS timeout for {domain}")
    except Exception as e:
        logger.error(f"DNS resolution failed for {domain}: {str(e)}")
    
    return None


@lru_cache(maxsize=128)
def _cached_get_all_ips(domain: str) -> tuple:
    """Get all IP addresses for domain (cached, returns tuple for hashability)"""
    ips = []
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        answers = resolver.resolve(domain, 'A')
        ips = [str(answer) for answer in answers]
    except Exception as e:
        logger.debug(f"Could not get all IPs for {domain}: {str(e)}")
    
    return tuple(ips)


def clear_dns_cache():
    """Clear DNS cache (useful for testing or forced refresh)"""
    _cached_resolve_domain.cache_clear()
    _cached_get_all_ips.cache_clear()
    logger.info("DNS cache cleared")