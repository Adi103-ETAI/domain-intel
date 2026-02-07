from typing import Dict
from app.core.rules import RiskRules
from app.models.domain import RiskAssessment
import logging

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    The AUTHORITY - Makes all risk decisions
    
    This is the brain of DomainIntel
    - Applies rules from rules.py
    - Calculates risk scores
    - Generates explanations
    - 100% deterministic
    - 0% AI involvement in decision-making
    """
    
    def __init__(self):
        self.rules = RiskRules()
    
    def assess_risk(self, normalized_data: Dict) -> RiskAssessment:
        """
        Perform complete risk assessment
        
        Args:
            normalized_data: Clean, standardized domain data from normalizer
        
        Returns:
            RiskAssessment object with score, level, reasons
        """
        try:
            # Calculate risk score using rules
            score, reasons = self.rules.calculate_risk_score(normalized_data)
            
            # Determine risk level
            risk_level = self.rules.get_risk_level(score)
            
            # Calculate data completeness for confidence
            completeness = self._calculate_completeness(normalized_data)
            confidence = self.rules.get_confidence_level(completeness)
            
            # Generate base explanation (without AI)
            explanation = self._generate_base_explanation(
                risk_level, 
                reasons, 
                normalized_data
            )
            
            logger.info(
                f"Risk assessment complete: {normalized_data.get('domain')} "
                f"scored {score} ({risk_level})"
            )
            
            return RiskAssessment(
                risk_score=score,
                risk_level=risk_level,
                confidence=confidence,
                reasons=reasons,
                explanation=explanation
            )
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {str(e)}")
            raise
    
    def _calculate_completeness(self, data: Dict) -> float:
        """Calculate what percentage of expected data is available"""
        expected_fields = [
            'domain_age_days',
            'registrar',
            'country_code',
            'https_enabled',
            'ip_address'
        ]
        
        available = sum(1 for field in expected_fields if data.get(field) is not None)
        return available / len(expected_fields)
    
    def _generate_base_explanation(
        self, 
        risk_level: str, 
        reasons: list, 
        data: Dict
    ) -> str:
        """
        Generate rule-based explanation
        This is replaced by AI explainer if enabled
        """
        domain = data.get('domain', 'the domain')
        
        if risk_level == "HIGH":
            prefix = f"The domain '{domain}' exhibits multiple high-risk indicators."
        elif risk_level == "MEDIUM":
            prefix = f"The domain '{domain}' shows moderate risk factors."
        else:
            prefix = f"The domain '{domain}' appears to have minimal risk indicators."
        
        if reasons:
            factors = " Key factors include: " + "; ".join(reasons[:3])  # Top 3 reasons
        else:
            factors = " Standard checks passed with no major concerns."
        
        recommendation = {
            "HIGH": " Immediate verification and investigation recommended.",
            "MEDIUM": " Further investigation may be warranted.",
            "LOW": " Standard monitoring procedures apply."
        }.get(risk_level, "")
        
        return prefix + factors + recommendation