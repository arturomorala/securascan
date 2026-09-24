from __future__ import annotations
import time
import uuid
from sqlalchemy import select, func
from app.db.session import SessionLocal
from app.models import User, Organization, OrganizationMember, Scan, ScanCheck, Finding, FindingOccurrence, ScanStage, Report
from app.services.sites import create_site
from app.services.scans import create_scan

TARGET = "https://securascan-v04-web-production.up.railway.app/"
TERMINAL = {"COMPLETED", "PARTIAL", "FAILED"}

def main():
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:12]
        user = User(email=f"e2e-v05-{suffix}@example.test", password_hash="E2E_DISABLED", first_name="E2E", status="DISABLED")
        db.add(user)
        db.flush()
        org = Organization(name=f"E2E V05 {suffix}", slug=f"e2e-v05-{suffix}", owner_user_id=user.id, plan_code="FREE")
        db.add(org)
        db.flush()
        db.add(OrganizationMember(organization_id=org.id, user_id=user.id, role="OWNER"))
        db.commit()
        site = create_site(db, org.id, user.id, TARGET, "VulnLab v0.5 Regression")
        scan = create_scan(db, site, user.id, trigger="MANUAL")
        scan_id = scan.id
        print(f"E2E_CREATED user_id={user.id} org_id={org.id} site_id={site.id} scan_id={scan.id} target={TARGET}", flush=True)
    finally:
        db.close()

    deadline = time.time() + 240
    last = None
    while time.time() < deadline:
        db = SessionLocal()
        try:
            scan = db.get(Scan, scan_id)
            if scan is None:
                raise RuntimeError("scan disappeared")
            if scan.status != last:
                print(f"E2E_STATUS scan_id={scan.id} status={scan.status} score={scan.score} risk={scan.risk_level}", flush=True)
                last = scan.status
            if scan.status in TERMINAL:
                check_rows = db.scalars(select(ScanCheck).where(ScanCheck.scan_id == scan.id).order_by(ScanCheck.id)).all()
                checks = len(check_rows)
                occs = db.scalar(select(func.count(FindingOccurrence.id)).where(FindingOccurrence.scan_id == scan.id)) or 0
                stages = db.scalars(select(ScanStage).where(ScanStage.scan_id == scan.id).order_by(ScanStage.id)).all()
                finding_ids = db.scalars(select(FindingOccurrence.finding_id).where(FindingOccurrence.scan_id == scan.id)).all()
                findings = db.scalars(select(Finding).where(Finding.id.in_(finding_ids))).all() if finding_ids else []
                report = db.scalar(select(Report).where(Report.scan_id == scan.id))
                print("E2E_RESULT "
                      f"status={scan.status} score={scan.score} risk={scan.risk_level} "
                      f"checks={checks} findings={occs} report={'yes' if report else 'no'} "
                      f"error_code={scan.error_code!r} error={scan.error_message_safe!r}", flush=True)
                for s in stages:
                    print(f"E2E_STAGE stage={s.stage} status={s.status}", flush=True)
                for ch in check_rows:
                    data = ch.result_json or {}
                    summary = {}
                    if isinstance(data, dict):
                        for k in ("pages_scanned","max_depth","discovered","probes","tokens","technologies","observations","endpoints","surface"):
                            if k in data:
                                v = data[k]
                                summary[k] = len(v) if isinstance(v, list) else v
                    print(f"E2E_CHECK key={ch.check_key} status={ch.status} summary={summary}", flush=True)
                for f in findings:
                    print(f"E2E_FINDING severity={f.severity} type={f.type} title={f.title}", flush=True)
                return
        finally:
            db.close()
        time.sleep(2)
    print("E2E_TIMEOUT", flush=True)

if __name__ == "__main__":
    main()
