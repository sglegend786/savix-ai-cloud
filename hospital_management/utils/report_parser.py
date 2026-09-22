"""
Extracts text from uploaded report files where possible.

- PDF: uses pdfplumber to pull raw text.
- Images (jpg/png): we do NOT have a guaranteed OCR engine (tesseract) in
  every environment, so we do not fabricate extracted text. We simply mark
  the file as an image report; analysis for images relies on the demo
  parameter set generated in utils/analysis.py (clearly labelled as a
  simulated academic dataset).
"""

import os

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False


def extract_text_from_pdf(filepath):
    if not PDFPLUMBER_AVAILABLE:
        return ""
    text_chunks = []
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_chunks.append(page_text)
    except Exception:
        return ""
    return "\n".join(text_chunks).strip()


def extract_report_text(filepath, file_ext):
    """Returns extracted text (may be empty string if not extractable)."""
    file_ext = file_ext.lower()
    if file_ext == "pdf":
        return extract_text_from_pdf(filepath)
    # jpg/jpeg/png -> no reliable OCR without tesseract binary installed;
    # leave blank, analysis module supplies demo structured parameters instead.
    return ""


def get_file_extension(filename):
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1].lower()
