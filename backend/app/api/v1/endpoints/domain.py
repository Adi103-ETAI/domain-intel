from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.domain import DomainAnalysisRequest, DomainAnalysisResponse
from app.services.whois_service import WHOISService
from app.services.dns_service import DNSService
from app.services.ip_service import IPService
from app.services.ssl_service import SSLService
from app.core.normalizer import DataNormalizer
from app.core.risk_engine import RiskEngine
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
whois_service = WHOISService()
dns_service = DNSService()
ip_service = IPService()
ssl_service = SSLService()
normalizer = DataNormalizer()
risk_engine = RiskEngine()


@router.post("/analyze", response_model=DomainAnalysisResponse)
async def analyze_domain(request: DomainAnalysisRequest):
    """
    Analyze a domain for risk assessment
    
    This is the main endpoint that orchestrates:
    1. Data collection from multiple sources
    2. Data normalization
    3. Risk assessment
    4. Response generation
    """
    domain = request.domain
    
    try:
        logger.info(f"Starting analysis for domain: {domain}")
        
        # Step 1: Resolve domain to IP
        ip_address = dns_service.resolve_domain(domain)
        if not ip_address:
            raise HTTPException(
                status_code=404,
                detail=f"Domain '{domain}' could not be resolved. It may not exist or DNS is unavailable."
            )
        
        logger.info(f"Domain {domain} resolved to {ip_address}")
        
        # Step 2: Fetch data from all sources (parallel-ready)
        whois_data = whois_service.get_whois_data(domain)
        ip_data = ip_service.get_ip_info(ip_address)
        ssl_data = ssl_service.check_ssl(domain)
        
        # Step 3: Normalize all data
        normalized_whois = normalizer.normalize_whois_data(whois_data)
        normalized_ip = normalizer.normalize_ip_data(ip_data)
        normalized_ssl = normalizer.normalize_ssl_data(ssl_data)
        
        # Merge all normalized data
        normalized_data = normalizer.merge_normalized_data(
            domain,
            normalized_whois,
            normalized_ip,
            normalized_ssl,
            {'ip_address': ip_address}
        )
        
        logger.info(f"Data normalization complete for {domain}")
        
        # Step 4: Risk assessment
        risk_assessment = risk_engine.assess_risk(normalized_data)
        
        logger.info(
            f"Risk assessment complete: {domain} = {risk_assessment.risk_level} "
            f"(score: {risk_assessment.risk_score})"
        )
        
        # Step 5: Build response
        response_data = {
            "domain": domain,
            "analyst_name": request.analyst_name,
            "case_id": request.case_id,
            "domain_info": {
                "registrar": normalized_whois.get('registrar'),
                "creation_date": normalized_whois.get('creation_date'),
                "expiry_date": normalized_whois.get('expiry_date'),
                "domain_age_days": normalized_whois.get('domain_age_days'),
                "nameservers": normalized_whois.get('nameservers', []),
                "status": normalized_whois.get('status', []),
            },
            "hosting_info": {
                "ip_address": ip_address,
                "country": normalized_ip.get('country'),
                "country_code": normalized_ip.get('country_code'),
                "city": normalized_ip.get('city'),
                "region": normalized_ip.get('region'),
                "isp": normalized_ip.get('isp'),
                "asn": normalized_ip.get('asn'),
                "organization": normalized_ip.get('organization'),
                "hosting_type": normalized_ip.get('hosting_type'),
            },
            "security_info": {
                "https_enabled": normalized_ssl.get('https_enabled', False),
                "ssl_valid": normalized_ssl.get('ssl_valid', False),
                "ssl_issuer": normalized_ssl.get('ssl_issuer'),
                "ssl_expiry": normalized_ssl.get('ssl_expiry'),
                "blacklisted": False,  # Placeholder - implement if VirusTotal added
                "blacklist_sources": [],
            },
            "risk_assessment": {
                "risk_score": risk_assessment.risk_score,
                "risk_level": risk_assessment.risk_level,
                "confidence": risk_assessment.confidence,
                "reasons": risk_assessment.reasons,
                "explanation": risk_assessment.explanation,
            }
        }
        
        return DomainAnalysisResponse(
            status="success",
            data=response_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Domain analysis failed for {domain}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "DomainIntel",
        "version": "1.0.0"
    }