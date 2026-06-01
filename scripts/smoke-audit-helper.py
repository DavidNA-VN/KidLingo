from app.core.database import SessionLocal
from fastapi import Request

from app.services.audit_service import AuditAction, get_request_context, record_audit_event, sanitize_metadata


def main() -> None:
    safe = sanitize_metadata(
        {
            "password": "must-not-leak",
            "nested": {"authorization": "Bearer secret", "note": "visible"},
            "canvas_image_data_url": "data:image/png;base64,secret",
        }
    )
    if safe["password"] != "[REDACTED]":
        raise RuntimeError("password sanitizer failed")
    if safe["nested"]["authorization"] != "[REDACTED]":
        raise RuntimeError("authorization sanitizer failed")
    if safe["canvas_image_data_url"] != "[REDACTED]":
        raise RuntimeError("canvas sanitizer failed")

    request = Request(
        {
            "type": "http",
            "method": "POST",
            "scheme": "http",
            "path": "/api/v1/auth/login",
            "raw_path": b"/api/v1/auth/login",
            "query_string": b"",
            "headers": [
                (b"x-forwarded-for", b"203.0.113.10, 127.0.0.1"),
                (b"x-request-id", b"phase26-context-request"),
                (b"user-agent", b"phase26-context-smoke"),
            ],
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
        }
    )
    context = get_request_context(request)
    if context["ip_address"] != "127.0.0.1":
        raise RuntimeError("request context IP extraction failed")
    if context["request_id"] != "phase26-context-request":
        raise RuntimeError("request context ID extraction failed")

    with SessionLocal() as db:
        event = record_audit_event(
            db,
            action=AuditAction.AUTH_LOGIN_FAILED,
            actor_email="phase26-smoke@doodle.test",
            actor_role=None,
            result="FAILURE",
            category="AUTH",
            request_context={
                "request_id": "phase26-smoke-request",
                "ip_address": "127.0.0.1",
                "user_agent": "phase26-smoke",
                "http_method": "POST",
                "request_path": "/api/v1/auth/login",
            },
            metadata={"password": "must-not-leak", "reason": "INVALID_CREDENTIALS"},
        )
        db.commit()
        db.refresh(event)
        if event.risk_level != "MEDIUM":
            raise RuntimeError("risk resolver failed")
        if event.metadata_json["password"] != "[REDACTED]":
            raise RuntimeError("stored metadata sanitizer failed")
        print(f"audit-helper=ok id={event.id} risk={event.risk_level}")


if __name__ == "__main__":
    main()
