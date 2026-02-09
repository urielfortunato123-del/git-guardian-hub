"""
LovHub Agent - License Verification Module
Verifies license key against the cloud server with heartbeat.
"""
import os
import json
import hashlib
import platform
import threading
import time
from pathlib import Path
from typing import Optional

import requests

LICENSE_FILE = Path.home() / ".infinity_agent" / ".license"
HEARTBEAT_INTERVAL = 3600  # 1 hour

# Default to production URL — override with env var for dev
LICENSE_SERVER_URL = os.environ.get(
    "LOVHUB_LICENSE_URL",
    ""  # Set this to your deployed edge function URL
)


def get_hardware_id() -> str:
    """Generate a unique hardware ID from machine characteristics."""
    parts = [
        platform.node(),
        platform.machine(),
        platform.processor(),
    ]
    # Try to get MAC address
    try:
        import uuid
        mac = uuid.getnode()
        parts.append(str(mac))
    except Exception:
        pass
    raw = "|".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _call_server(action: str, license_key: str, hardware_id: Optional[str] = None) -> dict:
    """Call the license verification server."""
    if not LICENSE_SERVER_URL:
        # No server configured — allow (dev mode)
        return {"valid": True, "message": "No license server configured (dev mode)"}
    
    payload = {
        "action": action,
        "license_key": license_key,
    }
    if hardware_id:
        payload["hardware_id"] = hardware_id
    
    try:
        resp = requests.post(LICENSE_SERVER_URL, json=payload, timeout=10)
        return resp.json()
    except Exception as e:
        # If server unreachable, allow grace period
        return {"valid": True, "message": f"Server unreachable (grace): {e}"}


def save_license(license_key: str):
    """Save license key to disk."""
    LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"license_key": license_key, "hardware_id": get_hardware_id()}
    LICENSE_FILE.write_text(json.dumps(data), encoding="utf-8")


def load_license() -> Optional[str]:
    """Load saved license key from disk."""
    if LICENSE_FILE.exists():
        try:
            data = json.loads(LICENSE_FILE.read_text(encoding="utf-8"))
            return data.get("license_key")
        except Exception:
            pass
    return None


def activate_license(license_key: str) -> dict:
    """Activate a license key on this machine."""
    hw_id = get_hardware_id()
    result = _call_server("activate", license_key, hw_id)
    if result.get("valid"):
        save_license(license_key)
    return result


def verify_license() -> dict:
    """Verify the currently saved license."""
    key = load_license()
    if not key:
        return {"valid": False, "error": "No license found. Use /v1/license/activate to register."}
    
    hw_id = get_hardware_id()
    return _call_server("heartbeat", key, hw_id)


def _heartbeat_loop():
    """Background thread that sends heartbeats periodically."""
    while True:
        time.sleep(HEARTBEAT_INTERVAL)
        try:
            verify_license()
        except Exception:
            pass


def start_heartbeat():
    """Start the background heartbeat thread."""
    t = threading.Thread(target=_heartbeat_loop, daemon=True)
    t.start()
