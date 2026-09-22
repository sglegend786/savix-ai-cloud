"""
Serves uploaded hospital/doctor images.

Files are served by filename only through send_from_directory, so the
internal filesystem path is never exposed to the client and directory
traversal is prevented by Flask/Werkzeug's own safe_join.
"""

import os

from flask import Blueprint, send_from_directory, abort

from config import Config

media_bp = Blueprint("media", __name__, url_prefix="/media")


@media_bp.route("/hospitals/<path:filename>")
def hospital_image(filename):
    filepath = os.path.join(Config.HOSPITAL_IMAGE_FOLDER, filename)
    if not os.path.isfile(filepath):
        abort(404)
    return send_from_directory(Config.HOSPITAL_IMAGE_FOLDER, filename)


@media_bp.route("/doctors/<path:filename>")
def doctor_image(filename):
    filepath = os.path.join(Config.DOCTOR_IMAGE_FOLDER, filename)
    if not os.path.isfile(filepath):
        abort(404)
    return send_from_directory(Config.DOCTOR_IMAGE_FOLDER, filename)
