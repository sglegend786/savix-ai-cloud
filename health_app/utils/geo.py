"""
Location utilities: distance calculation and coordinate validation.
No external API key required - pure math (haversine formula) plus
free OpenStreetMap/Leaflet.js for the map and a plain Google Maps
directions URL (no JS API key needed for a simple deep link).
"""

import math


def valid_latitude(lat):
    try:
        lat = float(lat)
        return -90 <= lat <= 90
    except (TypeError, ValueError):
        return False


def valid_longitude(lng):
    try:
        lng = float(lng)
        return -180 <= lng <= 180
    except (TypeError, ValueError):
        return False


def valid_pincode(pincode):
    pincode = (pincode or "").strip()
    return pincode.isdigit() and len(pincode) in (5, 6)


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance between two points in kilometres."""
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (TypeError, ValueError):
        return None

    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)


def has_coordinates(entity):
    """entity: dict with 'latitude'/'longitude' keys (may be missing/empty)."""
    return valid_latitude(entity.get("latitude")) and valid_longitude(entity.get("longitude"))


def directions_url(lat, lng):
    """Plain Google Maps directions deep link - no API key required."""
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"


def attach_distance(entities, user_lat, user_lng):
    """Mutates each entity in-place to add 'computed_distance_km' when both
    the entity and the user have valid coordinates; otherwise None."""
    for e in entities:
        if has_coordinates(e) and valid_latitude(user_lat) and valid_longitude(user_lng):
            e["computed_distance_km"] = haversine_km(user_lat, user_lng, e["latitude"], e["longitude"])
        else:
            e["computed_distance_km"] = None
    return entities
