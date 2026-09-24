from __future__ import annotations
import sys
import time
import uuid
from sqlalchemy import select, func
from app.db.session import SessionLocal
from app.models import User, Organization, OrganizationMember, Scan, ScanCheck, Finding, FindingOccurrence, ScanStage, Report
from app.services.sites import create_site
from app.services.scans import create_scan

TARGET = "https://securascan-v04-web-production.up.railway.app/"
TERMINAL = {"COMPLETED", "PARTIAL", "FAILED"}
EXPECTED = {
    "CORS_ORIGIN_REFLECTION",
    "CORS_NULL_ORIGIN_CREDENTIALS",
    "SQLI_ERROR_SIGNAL",
    "SQLI_BOOLEAN_SIGNAL",
    "GRAPHQL_INTROSPECTION_ENABLED",
    "JWT_ALG_NONE",
    "JWT_NO_EXP",
    "AUTH_RESPONSE_CACHEABLE",
    "JSON_SQL_ERROR_SIGNAL",
    "HTTP_TRACE_ENABLED",
    "OPENAPI_SCHEMA_EXPOSED",
    "PACKAGE_JSON_EXPOSED",
    "DOTENV_EXPOSED",
    "GIT_METADATA_EXPOSED",
    "BACKUP_FILE_EXPOSED",
    "DIRECTORY_LISTING",
    "INSECURE_FORM_ACTION",
    "TECHNOLOGY_VERSION_DISCLOSURE",
}

def main():
    db=SessionLocal()
    try:
        suffix=uuid.uuid4().hex[:12]
        user=User(email=f"e2e-v06-{suffix}@example.test", password_hash="E2E_DISABLED", first_name="E2E", status="DISABLED")
        db.add(user); db.flush()
        org=Organization(name=f"E2E V06 {suffix}", slug=f"e2e-v06-{suffix}", owner_user_id=user.id, plan_code="FREE")
        db.add(org); db.flush()
        db.add(OrganizationMember(organization_id=org.id,user_id=user.id,role="OWNER"))
        db.commit()
        site=create_site(db,org.id,user.id,TARGET,"VulnLab v0.6 Regression")
        scan=create_scan(db,site,user.id,trigger="MANUAL")
        scan_id=scan.id
        print(f"E2E_CREATED scan_id={scan_id} target={TARGET}",flush=True)
    finally:
        db.close()

    deadline=time.time()+300
    while time.time()<deadline:
        db=SessionLocal()
        try:
            scan=db.get(Scan,scan_id)
            if scan and scan.status in TERMINAL:
                check_rows=db.scalars(select(ScanCheck).where(ScanCheck.scan_id==scan.id).order_by(ScanCheck.id)).all()
                checks=len(check_rows)
                occs=db.scalars(select(FindingOccurrence).where(FindingOccurrence.scan_id==scan.id)).all()
                ids={o.finding_id for o in occs}
                findings=db.scalars(select(Finding).where(Finding.id.in_(ids))).all() if ids else []
                types={f.type for f in findings}
                report=db.scalar(select(Report).where(Report.scan_id==scan.id))
                missing=sorted(EXPECTED-types)
                print(f"E2E_RESULT status={scan.status} score={scan.score} risk={scan.risk_level} checks={checks} findings={len(occs)} report={'yes' if report else 'no'}",flush=True)
                for f in sorted(findings,key=lambda x:(x.severity,x.type)):
                    print(f"E2E_FINDING severity={f.severity} type={f.type} title={f.title}",flush=True)
                check_keys={x.check_key for x in check_rows}
                required_checks={"graphql_v063","api_docs_v063","technology_v063"}
                missing_checks=sorted(required_checks-check_keys)
                print(f"E2E_CHECK_KEYS {sorted(check_keys)}",flush=True)
                print(f"E2E_EXPECTED_MISSING {missing}",flush=True)
                print(f"E2E_CHECKS_MISSING {missing_checks}",flush=True)
                if scan.status not in {"COMPLETED","PARTIAL"} or missing or missing_checks:
                    return 2
                return 0
        finally:
            db.close()
        time.sleep(2)
    print("E2E_TIMEOUT",flush=True)
    return 3

if __name__=="__main__":
    raise SystemExit(main())
