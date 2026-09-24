FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY securascan_v0.1.2_railway.zip /tmp/securascan.zip
RUN unzip /tmp/securascan.zip -d /tmp/securascan \
    && cp -a /tmp/securascan/securascan/. /app/ \
    && rm -rf /tmp/securascan /tmp/securascan.zip

RUN pip install --no-cache-dir -r requirements.txt

CMD ["sh", "scripts/start-web.sh"]
