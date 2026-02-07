import dns.resolver
import socket
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class DNSService:
    """DNS resolution service"""
    
    def __init__(self):
        self.resolver = dns.resolver.Resolver()
        self.resolver.timeout = 5
        self.resolver.lifetime = 5
    
    def resolve_domain(self, domain: str) -> Optional[str]:
        """
        Resolve domain to IP address
        
        Returns:
            Primary IP address or None
        """
        try:
            # Try A record
            answers = self.resolver.resolve(domain, 'A')
            if answers:
                return str(answers[0])
        except dns.resolver.NXDOMAIN:
            logger.warning(f"Domain {domain} does not exist")
        except dns.resolver.Timeout:
            logger.warning(f"DNS timeout for {domain}")
        except Exception as e:
            logger.error(f"DNS resolution failed for {domain}: {str(e)}")
        
        return None
    
    def get_all_ips(self, domain: str) -> List[str]:
        """Get all IP addresses for domain"""
        ips = []
        try:
            answers = self.resolver.resolve(domain, 'A')
            ips = [str(answer) for answer in answers]
        except Exception as e:
            logger.debug(f"Could not get all IPs for {domain}: {str(e)}")
        
        return ips
    
    def get_nameservers(self, domain: str) -> List[str]:
        """Get nameservers for domain"""
        nameservers = []
        try:
            answers = self.resolver.resolve(domain, 'NS')
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