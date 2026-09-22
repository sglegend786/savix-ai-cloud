from functools import wraps
from flask import session, redirect, url_for, flash, abort, jsonify


def api_login_required(role=None):
    """Like login_required, but for JSON API endpoints: returns a JSON
    401/403 instead of redirecting/aborting with an HTML page. `role` may
    be a single role string or a tuple/list of allowed roles.
    """
    allowed = (role,) if isinstance(role, str) else role

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            current_role = session.get("role")
            if not current_role:
                return jsonify({"success": False, "error": "Login required."}), 401
            if allowed and current_role not in allowed:
                return jsonify({"success": False, "error": "Not authorized for this role."}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator


def login_required(role=None):
    """Decorator factory. role can be 'user', 'hospital', 'health_worker',
    a tuple/list of allowed roles, or None (any logged in).
    This enforces BACKEND authorization - not just hiding buttons in HTML.
    """
    allowed = (role,) if isinstance(role, str) else role

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            current_role = session.get("role")
            if not current_role:
                flash("Please login to continue.", "warning")
                return redirect(url_for("index"))
            if allowed and current_role not in allowed:
                # Logged in, but wrong role trying to access a protected route
                abort(403)
            return f(*args, **kwargs)
        return wrapped
    return decorator
