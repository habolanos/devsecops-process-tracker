# ============================================================================
# Multi-stage Dockerfile for DevSecOps Process Tracker
# Standards: OCI Image Spec, CIS Docker Benchmark, SLSA Level 3
# ============================================================================

# Build arguments for OCI labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest

# ==========================================================================
# Stage 1: Dependencies
# ==========================================================================
FROM node:24-alpine AS deps

# Security: Update Alpine packages to fix vulnerabilities (zlib, etc.)
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files (without lock file to apply overrides)
COPY nextjs_space/package.json ./

# Install dependencies with cache mount for faster rebuilds
# Override versions in package.json will force secure versions
RUN --mount=type=cache,target=/root/.npm \
    npm install --prefer-offline --no-audit && \
    npm audit fix --force || true

# ==========================================================================
# Stage 2: Builder
# ==========================================================================
FROM node:24-alpine AS builder

# Security: Update Alpine packages
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY nextjs_space ./

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build application with npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# ==========================================================================
# Stage 3: Production Runner
# ==========================================================================
FROM node:24-alpine AS runner

# Security: Update Alpine packages
RUN apk update && apk upgrade --no-cache

# Re-declare build args for this stage (required for LABEL to access them)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# OCI Image Labels (https://github.com/opencontainers/image-spec/blob/main/annotations.md)
LABEL org.opencontainers.image.title="DevSecOps Process Tracker" \
      org.opencontainers.image.description="Web application for DevSecOps process management with evidence tracking, dependencies, and exports" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Harold Adrian" \
      org.opencontainers.image.licenses="GPL-3.0" \
      org.opencontainers.image.source="https://github.com/habolanos/devsecops-process-tracker" \
      org.opencontainers.image.documentation="https://github.com/habolanos/devsecops-process-tracker/blob/main/README.md" \
      org.opencontainers.image.base.name="node:24-alpine"

WORKDIR /app

# Environment configuration
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Security: Create non-root user (CIS Docker Benchmark 4.1)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy necessary files with correct ownership
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Security: Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check (CIS Docker Benchmark 4.6)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start application
CMD ["node", "server.js"]
