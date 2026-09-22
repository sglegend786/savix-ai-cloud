"""
Secure image upload/replace/delete for hospital and doctor profile
images. Validates extension, actual image content (via Pillow, so a
renamed .exe can't pass as a .jpg), and size; uses unique filenames and
never trusts the client-supplied filename directly.
"""

import os
import uuid

from werkzeug.utils import secure_filename
from PIL import Image, UnidentifiedImageError

IMAGE_ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
IMAGE_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _ext_ok(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in IMAGE_ALLOWED_EXTENSIONS


def validate_and_save_image(file_storage, upload_folder, prefix=""):
    """Validates a Flask FileStorage as a real image and saves it with a
    unique, safe filename. Returns (filename, error) - filename is None
    on failure, with error set to a user-facing message.
    """
    if not file_storage or file_storage.filename == "":
        return None, "No file selected."

    if not _ext_ok(file_storage.filename):
        return None, "Only JPG, JPEG, PNG, and WebP images are allowed."

    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)
    if size > IMAGE_MAX_BYTES:
        return None, "Image is too large (max 5 MB)."
    if size == 0:
        return None, "Uploaded file is empty."

    # Verify the file is ACTUALLY an image (not just named .jpg) - this
    # blocks executables/scripts renamed with an image extension.
    try:
        img = Image.open(file_storage.stream)
        img.verify()
    except (UnidentifiedImageError, OSError):
        return None, "The uploaded file is not a valid image."
    finally:
        file_storage.stream.seek(0)

    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    safe_base = secure_filename(file_storage.filename.rsplit(".", 1)[0]) or "image"
    unique_name = f"{prefix}{uuid.uuid4().hex}_{safe_base}.{ext}"

    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, unique_name)
    file_storage.save(filepath)

    return unique_name, None


def delete_image(upload_folder, filename):
    """Safely remove a previously uploaded image file, ignoring missing files."""
    if not filename:
        return
    filepath = os.path.join(upload_folder, filename)
    try:
        if os.path.isfile(filepath):
            os.remove(filepath)
    except OSError:
        pass
