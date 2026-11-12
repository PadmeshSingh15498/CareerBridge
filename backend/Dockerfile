# ==============================================================================
# CareerBridge Backend Production Dockerfile
# Multi-stage security hardened container for FastAPI & AI Services
# ==============================================================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies to wheels cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# ------------------------------------------------------------------------------
# Final Production Runtime Stage
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

# Install curl for docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache /wheels/* && \
    rm -rf /wheels

# Create dedicated non-root application user
RUN groupadd -g 1000 careerbridge && \
    useradd -u 1000 -g careerbridge -s /bin/bash -m careerbridge

# Create directory for persistent file storage (resumes)
RUN mkdir -p /app/storage/resumes && \
    chown -R careerbridge:careerbridge /app

# Copy application code
COPY --chown=careerbridge:careerbridge . /app

# Declare persistent storage volume for candidate resumes
VOLUME ["/app/storage/resumes"]

# Switch to non-privileged user
USER careerbridge

EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production WSGI/ASGI Server invocation
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips", "*"]

