"""
Lightweight audit logging for security/privacy-relevant actions
(referral creation/status changes, emergency triggers, consent capture).
Part of the ABDM/ABHA "integration-ready" architecture requirement -
interoperable systems require an audit trail even before a live external
integration exists.
"""

from datetime import datetime


def log_action(db, actor_role, actor_id, actor_name, action, target_type, target_id, details=None):
    db.audit_logs.insert_one({
        "actor_role": actor_role,
        "actor_id": actor_id,
        "actor_name": actor_name,
        "action": action,
        "target_type": target_type,
        "target_id": str(target_id) if target_id else None,
        "details": details or "",
        "at": datetime.utcnow(),
    })
