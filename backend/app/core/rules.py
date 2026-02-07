from typing import Dict, List, Tuple


class RiskRules:
    """
    Court-defensible, rule-based risk assessment
    
    Design Principle:
    - NO AI predictions
    - NO black-box decisions
    - ONLY transparent, explainable rules
    - Each rule has a point value and reason
    """
    
    # Risk categories
    RISK_HIGH = "HIGH"
    RISK_MEDIUM = "MEDIUM"
    RISK_LOW = "LOW"
    
    # Score thresholds
    HIGH_RISK_THRESHOLD = 60
    MEDIUM_RISK_THRESHOLD = 30
    
    # Known abused registrars (free/cheap platforms)
    ABUSED_REGISTRARS = [
        "namecheap",
        "freenom",
        "dynadot",
        "godaddy", # Include if historically abused in your region
    ]
    
    # High-risk TLDs
    HIGH_RISK_TLDS = [
        ".xyz", ".top", ".club", ".loan", ".win", 
        ".review", ".cricket", ".science", ".work"
    ]
    
    # Countries considered high-risk for hosting (adjust per local context)
    HIGH_RISK_COUNTRIES = [
        "CN",  # China
        "RU",  # Russia
        "VN",  # Vietnam
        "UA",  # Ukraine
    ]
    
    @staticmethod
    def calculate_risk_score(normalized_data: Dict) -> Tuple[int, List[str]]:
        """
        Calculate risk score based on normalized domain data
        
        Returns:
            Tuple of (score, list_of_reasons)
        """
        score = 0
        reasons = []
        
        # Rule 1: Domain Age
        domain_age = normalized_data.get('domain_age_days')
        if domain_age is not None:
            if domain_age < 7:
                score += 30
                reasons.append(f"Domain registered only {domain_age} days ago (extremely recent)")
            elif domain_age < 30:
                score += 20
                reasons.append(f"Domain registered {domain_age} days ago (recently created)")
            elif domain_age < 90:
                score += 10
                reasons.append(f"Domain registered {domain_age} days ago (relatively new)")
        
        # Rule 2: Registrar Reputation
        registrar = normalized_data.get('registrar', '').lower()
        if any(abused in registrar for abused in RiskRules.ABUSED_REGISTRARS):
            score += 15
            reasons.append(f"Registered via '{registrar}' - frequently abused in fraud cases")
        
        # Rule 3: TLD Risk
        domain = normalized_data.get('domain', '')
        tld = f".{domain.split('.')[-1]}" if '.' in domain else ""
        if tld in RiskRules.HIGH_RISK_TLDS:
            score += 15
            reasons.append(f"Top-level domain '{tld}' associated with high-risk activities")
        
        # Rule 4: Hosting Location
        country_code = normalized_data.get('country_code', '')
        if country_code and country_code != 'IN':
            if country_code in RiskRules.HIGH_RISK_COUNTRIES:
                score += 25
                reasons.append(f"Hosted in {country_code} - high-risk jurisdiction")
            else:
                score += 15
                reasons.append(f"Hosted outside India ({country_code})")
        
        # Rule 5: Hosting Type
        hosting_type = normalized_data.get('hosting_type', '').lower()
        if hosting_type == 'shared':
            score += 10
            reasons.append("Uses shared hosting infrastructure (common in fraud schemes)")
        
        # Rule 6: HTTPS/SSL
        if not normalized_data.get('https_enabled', False):
            score += 20
            reasons.append("HTTPS encryption not enabled (security risk)")
        elif not normalized_data.get('ssl_valid', False):
            score += 10
            reasons.append("SSL certificate invalid or expired")
        
        # Rule 7: Blacklist Status
        if normalized_data.get('blacklisted', False):
            score += 40
            sources = normalized_data.get('blacklist_sources', [])
            reasons.append(f"Domain found in security blacklists: {', '.join(sources)}")
        
        # Rule 8: Domain Keywords (financial fraud indicators)
        fraud_keywords = ['loan', 'bank', 'pay', 'wallet', 'invest', 'profit', 'win', 'prize']
        domain_lower = domain.lower()
        if any(keyword in domain_lower for keyword in fraud_keywords):
            score += 10
            reasons.append("Domain name contains financial/fraud-related keywords")
        
        # Cap score at 100
        score = min(score, 100)
        
        return score, reasons
    
    @staticmethod
    def get_risk_level(score: int) -> str:
        """Convert numeric score to risk level"""
        if score >= RiskRules.HIGH_RISK_THRESHOLD:
            return RiskRules.RISK_HIGH
        elif score >= RiskRules.MEDIUM_RISK_THRESHOLD:
            return RiskRules.RISK_MEDIUM
        else:
            return RiskRules.RISK_LOW
    
    @staticmethod
    def get_confidence_level(data_completeness: float) -> str:
        """
        Determine confidence based on data completeness
        
        Args:
            data_completeness: Percentage of available data (0.0 to 1.0)
        """
        if data_completeness >= 0.8:
            return "high"
        elif data_completeness >= 0.5:
            return "medium"
        else:
            return "low"