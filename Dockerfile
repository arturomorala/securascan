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

RUN pip install --no-cache-dir -r requirements.txt

CMD ["sh", "scripts/start-web.sh"]
