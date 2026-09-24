FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Reconstruct the tested v0.2 base.
COPY payload /tmp/payload
RUN cat /tmp/payload/v02-part*.txt | base64 -d > /tmp/securascan.zip \
    && unzip /tmp/securascan.zip -d /tmp/securascan \
    && cp -a /tmp/securascan/securascan/. /app/ \
    && rm -rf /tmp/payload /tmp/securascan /tmp/securascan.zip

# Apply the tested v0.3 production overlay.
COPY prod_overlay_v03 /tmp/prod_overlay_v03
RUN cat /tmp/prod_overlay_v03/v03s*.txt | base64 -d > /tmp/v03overlay.zip \
    && unzip /tmp/v03overlay.zip -d /tmp/v03overlay \
    && cp -a /tmp/v03overlay/securascan/. /app/ \
    && rm -rf /tmp/prod_overlay_v03 /tmp/v03overlay /tmp/v03overlay.zip

# Apply the tested v0.4 commercial/email/hardening overlay.
# Explicit order avoids the superseded malformed v04-part01b.txt.
COPY payload_v04 /tmp/payload_v04
RUN cat \
      /tmp/payload_v04/v04-part00.txt \
      /tmp/payload_v04/v04-part01a.txt \
      /tmp/payload_v04/v04-part01b0.txt \
      /tmp/payload_v04/v04-part01b1.txt \
      /tmp/payload_v04/v04-part01b2.txt \
      /tmp/payload_v04/v04-part01b3.txt \
      /tmp/payload_v04/v04-part01b4.txt \
      /tmp/payload_v04/v04-part01c.txt \
      /tmp/payload_v04/v04-part01d.txt \
      /tmp/payload_v04/v04-part02a.txt \
      /tmp/payload_v04/v04-part02b.txt \
      /tmp/payload_v04/v04-part02c.txt \
      /tmp/payload_v04/v04-part02d.txt \
      /tmp/payload_v04/v04-part03.txt \
      /tmp/payload_v04/v04-part04.txt \
    | base64 -d > /tmp/v04overlay.zip \
    && unzip /tmp/v04overlay.zip -d /tmp/v04overlay \
    && cp -a /tmp/v04overlay/securascan/. /app/ \
    && rm -rf /tmp/payload_v04 /tmp/v04overlay /tmp/v04overlay.zip

# Apply v0.4.3 marketing landing without altering scanner/runtime behavior.
COPY marketing_v043 /tmp/marketing_v043
RUN cp /tmp/marketing_v043/landing.html /app/app/templates/landing.html \
    && cat /tmp/marketing_v043/marketing.css >> /app/app/static/app.css \
    && python /tmp/marketing_v043/patch.py \
    && rm -rf /tmp/marketing_v043

# Apply SecuraScan v0.5 scanner engine overlay.
COPY scanner_v05_chunks /tmp/scanner_v05_chunks
RUN cat /tmp/scanner_v05_chunks/chunk00.txt /tmp/scanner_v05_chunks/chunk01.txt /tmp/scanner_v05_chunks/chunk02.txt /tmp/scanner_v05_chunks/chunk03a.txt /tmp/scanner_v05_chunks/chunk03b.txt | base64 -d > /tmp/scanner_v05_overlay.zip \
    && unzip /tmp/scanner_v05_overlay.zip -d /tmp/scanner_v05_overlay \
    && cp -a /tmp/scanner_v05_overlay/securascan/. /app/ \
    && rm -rf /tmp/scanner_v05_chunks /tmp/scanner_v05_overlay /tmp/scanner_v05_overlay.zip
RUN sed -i 's/SecuraScan worker v0.4 started/SecuraScan worker v0.5 started/' /app/app/worker.py

# Layer SecuraScan v0.6 on top of the validated v0.5 engine while keeping the
# previous implementation available for regression-safe reuse.
RUN mv /app/app/scanner/engine.py /app/app/scanner/engine_v05.py \
    && mv /app/app/scanner/rules.py /app/app/scanner/rules_v05.py
COPY scanner_v06/engine.py /app/app/scanner/engine.py
COPY scanner_v06/rules.py /app/app/scanner/rules.py
RUN python -m py_compile /app/app/scanner/engine.py /app/app/scanner/rules.py \
    && sed -i 's/SecuraScan worker v0.5 started/SecuraScan worker v0.6 started/' /app/app/worker.py

COPY e2e_v05_vulnlab.py /app/e2e_v05_vulnlab.py

# Preserve the validated v0.5 scanner so v0.6 can extend it without regressions.
RUN cp /app/app/scanner/engine.py /app/app/scanner/engine_v05.py \
    && cp /app/app/scanner/rules.py /app/app/scanner/rules_v05.py

# Apply SecuraScan v0.6 scanner layer.
COPY scanner_v06/engine.py /app/app/scanner/engine.py
COPY scanner_v06/rules.py /app/app/scanner/rules.py
COPY scanner_v06/selftest.py /app/scanner_v06_selftest.py
COPY e2e_v06_vulnlab.py /app/e2e_v06_vulnlab.py
RUN sed -i 's/SecuraScan worker v0.5 started/SecuraScan worker v0.6 started/' /app/app/worker.py \
    && sed -i 's/scanner_version="0.4.0"/scanner_version="0.6.0"/g' /app/app/services/scans.py \
    && sed -i 's/ruleset_version="0.4.0"/ruleset_version="0.6.0"/g' /app/app/services/scans.py

RUN pip install --no-cache-dir -r requirements.txt \
    && python -m compileall -q /app/app \
    && python /app/scanner_v06_selftest.py

CMD ["sh", "scripts/start-web.sh"]
