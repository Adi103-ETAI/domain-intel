from typing import Dict
from app.core.rules import RiskRules
from app.models.domain import RiskAssessment
from app.ai.explainer import AIExplainer
import logging

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    The AUTHORITY — makes all risk decisions.

    - 100% deterministic scoring
    - AI is used ONLY for explanation enhancement
    - Safe for law enforcement & court usage
    """

    def __init__(self):
        self.rules = RiskRules()
        self.ai_explainer = AIExplainer()  # Optional AI layer

    def assess_risk(self, normalized_data: Dict) -> RiskAssessment:
        """
        Perform complete risk assessment.

        AI is NEVER involved in:
        - scoring
        - classification
        - rule execution
        """
        try:
            # 1️⃣ Rule-based risk calculation (source of truth)
            score, reasons = self.rules.calculate_risk_score(normalized_data)
            risk_level = self.rules.get_risk_level(score)

            # 2️⃣ Confidence calculation
            completeness = self._calculate_completeness(normalized_data)
            confidence = self.rules.get_confidence_level(completeness)

            # 3️⃣ Deterministic explanation (always exists)
            explanation = self._generate_base_explanation(
                risk_level,
                reasons,
                normalized_data
            )

            # 4️⃣ AI explanation enhancement (optional, non-authoritative)
            ai_payload = {
                "domain": normalized_data.get("domain"),
                "risk_level": risk_level,
                "risk_score": score,
                "reasons": reasons,
                "confidence": confidence,
            }

            ai_explanation = self.ai_explainer.generate_explanation(ai_payload)
            if ai_explanation:
                explanation = ai_explanation

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
        """Calculate percentage of expected data present."""
        expected_fields = [
            "domain_age_days",
            "registrar",
            "country_code",
            "https_enabled",
            "ip_address",
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
        Deterministic rule-based explanation.
        AI may enhance this, but never replaces logic.
        """
        domain = data.get("domain", "the domain")

        if risk_level == "HIGH":
            prefix = f"The domain '{domain}' exhibits multiple high-risk indicators."
        elif risk_level == "MEDIUM":
            prefix = f"The domain '{domain}' shows moderate risk factors."
        else:
            prefix = f"The domain '{domain}' appears to have minimal risk indicators."

        if reasons:
            factors = " Key factors include: " + "; ".join(reasons[:3])
        else:
            factors = " Standard checks passed with no major concerns."

        recommendation = {
            "HIGH": " Immediate verification and investigation recommended.",
            "MEDIUM": " Further investigation may be warranted.",
            "LOW": " Standard monitoring procedures apply.",
        }.get(risk_level, "")

        return prefix + factors + recommendation
