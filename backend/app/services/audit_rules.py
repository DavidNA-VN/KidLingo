from __future__ import annotations


LOW = "LOW"
MEDIUM = "MEDIUM"
HIGH = "HIGH"

ALLOWED_RISK_LEVELS = {LOW, MEDIUM, HIGH}


def resolve_risk_level(*, action: str, result: str, risk_level: str | None = None) -> str:
    if risk_level:
        normalized = risk_level.upper().strip()
        if normalized not in ALLOWED_RISK_LEVELS:
            raise ValueError("INVALID_AUDIT_RISK_LEVEL")
        return normalized

    normalized_action = action.upper().strip()
    normalized_result = result.upper().strip()

    if normalized_action in {"AUTH.ACCESS_DENIED", "AUTH.ADMIN_ACCESS_DENIED"}:
        return HIGH
    if normalized_action in {"AUTH.LOGIN_FAILED", "UPLOAD.INVALID", "AI.PREDICTION_FAILED"}:
        return MEDIUM
    if normalized_result == "DENIED":
        return HIGH
    if normalized_result == "FAILURE":
        return MEDIUM
    return LOW
