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
COPY scanner_v05_overlay.b64 /tmp/scanner_v05_overlay.b64
RUN base64 -d /tmp/scanner_v05_overlay.b64 > /tmp/scanner_v05_overlay.zip \
    && unzip /tmp/scanner_v05_overlay.zip -d /tmp/scanner_v05_overlay \
    && cp -a /tmp/scanner_v05_overlay/securascan/. /app/ \
    && rm -rf /tmp/scanner_v05_overlay /tmp/scanner_v05_overlay.zip /tmp/scanner_v05_overlay.b64

RUN pip install --no-cache-dir -r requirements.txt

CMD ["sh", "scripts/start-web.sh"]
