from __future__ import annotations
import json
import sys
import time
import uuid
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import User, Organization, OrganizationMember, Scan, ScanCheck, Finding, FindingOccurrence, Report
from app.services.sites import create_site
from app.services.scans import create_scan

TARGET = "https://securascan-v04-web-production.up.railway.app/"
TERMINAL = {"COMPLETED", "PARTIAL", "FAILED"}

EXPECTED = {
    "REFLECTED_XSS_CONFIRMED",
    "SOURCE_MAP_EXPOSED",
    "FORWARDED_HOST_REFLECTION",
    "GRAPHQL_INTROSPECTION_ENABLED",
    "OPENAPI_SCHEMA_EXPOSED",
    "JWT_ALG_NONE",
    "SQLI_ERROR_SIGNAL",
    "SQLI_BOOLEAN_SIGNAL",
    "JSON_SQL_ERROR_SIGNAL",
    "HTTP_TRACE_ENABLED",
    "CORS_ORIGIN_REFLECTION",
    "DOTENV_EXPOSED",
    "GIT_METADATA_EXPOSED",
    "BACKUP_FILE_EXPOSED",
    "INSECURE_FORM_ACTION",
}

REQUIRED_CHECKS = {
    "scan_profile_v07",
    "discovery_docs_v07",
    "openapi_inventory_v07",
    "source_maps_v07",
    "csp_advanced_v07",
    "browser_v07",
    "forwarded_host_v07",
}

def main():
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:12]
        user = User(email=f"e2e-v07-{suffix}@example.test", password_hash="E2E_DISABLED", first_name="E2E", status="DISABLED")
        db.add(user); db.flush()
        org = Organization(name=f"E2E V07 {suffix}", slug=f"e2e-v07-{suffix}", owner_user_id=user.id, plan_code="FREE")
        db.add(org); db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role="OWNER"))
        db.commit()
        site = create_site(db, org.id, user.id, TARGET, "VulnLab v0.7 Regression")
        scan = create_scan(db, site, user.id, trigger="MANUAL", scan_type="LAB")
        scan_id = scan.id
        print(f"E2E_V07_CREATED scan_id={scan_id} mode={scan.type} target={TARGET}", flush=True)
    finally:
        db.close()

    deadline = time.time() + 420
    while time.time() < deadline:
        db = SessionLocal()
        try:
            scan = db.get(Scan, scan_id)
            if scan and scan.status in TERMINAL:
                checks = db.scalars(select(ScanCheck).where(ScanCheck.scan_id == scan.id).order_by(ScanCheck.id)).all()
                occurrences = db.scalars(select(FindingOccurrence).where(FindingOccurrence.scan_id == scan.id)).all()
                ids = {o.finding_id for o in occurrences}
                findings = db.scalars(select(Finding).where(Finding.id.in_(ids))).all() if ids else []
                types = {f.type for f in findings}
                check_keys = {c.check_key for c in checks}
                missing_findings = sorted(EXPECTED - types)
                missing_checks = sorted(REQUIRED_CHECKS - check_keys)
                browser = next((c for c in checks if c.check_key == "browser_v07"), None)
                browser_data = browser.result_json if browser else {}
                if isinstance(browser_data, str):
                    try: browser_data = json.loads(browser_data)
                    except Exception: browser_data = {}
                browser_available = bool((browser_data or {}).get("available"))
                profile = next((c for c in checks if c.check_key == "scan_profile_v07"), None)
                profile_data = profile.result_json if profile else {}
                if isinstance(profile_data, str):
                    try: profile_data = json.loads(profile_data)
                    except Exception: profile_data = {}
                report = db.scalar(select(Report).where(Report.scan_id == scan.id))
                print(
                    f"E2E_V07_RESULT status={scan.status} mode={scan.type} score={scan.score} risk={scan.risk_level} "
                    f"checks={len(checks)} findings={len(occurrences)} report={'yes' if report else 'no'} "
                    f"browser_available={browser_available}",
                    flush=True,
                )
                print(f"E2E_V07_PROFILE {profile_data}", flush=True)
                print(f"E2E_V07_CHECK_KEYS {sorted(check_keys)}", flush=True)
                print(f"E2E_V07_EXPECTED_MISSING {missing_findings}", flush=True)
                print(f"E2E_V07_CHECKS_MISSING {missing_checks}", flush=True)
                for f in sorted(findings, key=lambda x:(x.severity, x.type)):
                    if f.type in EXPECTED or f.type.startswith("SOURCE_MAP") or f.type.startswith("CSP_"):
                        print(f"E2E_V07_FINDING severity={f.severity} type={f.type} confidence={f.confidence}", flush=True)
                if scan.status not in {"COMPLETED", "PARTIAL"} or missing_findings or missing_checks or not browser_available or scan.type != "LAB":
                    return 2
                return 0
        finally:
            db.close()
        time.sleep(2)
    print("E2E_V07_TIMEOUT", flush=True)
    return 3

if __name__ == "__main__":
    raise SystemExit(main())
