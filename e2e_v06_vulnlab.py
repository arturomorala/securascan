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
    "SENSITIVE_RESPONSE_PUBLIC_CACHE",
    "HTTP_TRACE_ENABLED",
    "OPENAPI_SCHEMA_EXPOSED",
    "PACKAGE_JSON_EXPOSED",
    "DOTENV_EXPOSED",
    "GIT_METADATA_EXPOSED",
    "BACKUP_FILE_EXPOSED",
    "DIRECTORY_LISTING",
    "INSECURE_FORM_ACTION",
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
                checks=db.scalar(select(func.count(ScanCheck.id)).where(ScanCheck.scan_id==scan.id)) or 0
                occs=db.scalars(select(FindingOccurrence).where(FindingOccurrence.scan_id==scan.id)).all()
                ids={o.finding_id for o in occs}
                findings=db.scalars(select(Finding).where(Finding.id.in_(ids))).all() if ids else []
                types={f.type for f in findings}
                report=db.scalar(select(Report).where(Report.scan_id==scan.id))
                missing=sorted(EXPECTED-types)
                print(f"E2E_RESULT status={scan.status} score={scan.score} risk={scan.risk_level} checks={checks} findings={len(occs)} report={'yes' if report else 'no'}",flush=True)
                for f in sorted(findings,key=lambda x:(x.severity,x.type)):
                    print(f"E2E_FINDING severity={f.severity} type={f.type} title={f.title}",flush=True)
                print(f"E2E_EXPECTED_MISSING {missing}",flush=True)
                if scan.status not in {"COMPLETED","PARTIAL"} or missing:
                    return 2
                return 0
        finally:
            db.close()
        time.sleep(2)
    print("E2E_TIMEOUT",flush=True)
    return 3

if __name__=="__main__":
    raise SystemExit(main())
