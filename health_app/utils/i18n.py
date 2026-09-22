"""
Centralised i18n for SAVIX.

Translations live in translations/<lang>.json - adding a new language is
just dropping in another JSON file and listing it in SUPPORTED_LANGUAGES.
Templates call t('nav.dashboard'); a missing key falls back to English,
then to the key itself, so a missing translation never breaks a page.
"""

import json
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRANSLATIONS_DIR = os.path.join(BASE_DIR, "translations")

SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "हिंदी",
}
DEFAULT_LANGUAGE = "en"

_cache = {}


def load_language(lang):
    if lang in _cache:
        return _cache[lang]
    path = os.path.join(TRANSLATIONS_DIR, f"{lang}.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        data = {}
    _cache[lang] = data
    return data


def _lookup(data, key):
    """Resolve a dotted key path like 'nav.dashboard' in a nested dict."""
    node = data
    for part in key.split("."):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            return None
    return node if isinstance(node, str) else None


def translate(key, lang=None, **kwargs):
    lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    value = _lookup(load_language(lang), key)
    if value is None and lang != DEFAULT_LANGUAGE:
        value = _lookup(load_language(DEFAULT_LANGUAGE), key)
    if value is None:
        # Missing translation key - show the key rather than a blank page
        return key
    if kwargs:
        try:
            return value.format(**kwargs)
        except (KeyError, IndexError):
            return value
    return value
