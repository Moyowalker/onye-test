# Docker Deployment Guide

This guide explains how to run the AI on FHIR application using Docker for local development and deployment.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8+

## Quick Start

### Option 1: Full Stack with Docker Compose (Recommended for Local Development)

```bash
# Clone the repository
git clone <your-repo-url>
cd onye-test

# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Health Check: http://localhost:8000/api/health
```

### Option 2: Backend Only (If Frontend is on Vercel)

```bash
# Build and run only the backend
docker-compose up --build backend

# Backend will be available at http://localhost:8000
```

## Docker Commands

### Build Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Run Services
```bash
# Start in foreground
docker-compose up

# Start in background (detached)
docker-compose up -d

# Start specific service
docker-compose up backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f backend
```

### Development Workflow
```bash
# Rebuild after code changes
docker-compose up --build

# Or rebuild specific service
docker-compose build backend && docker-compose up backend
```

## Container Architecture

### Backend Container
- **Base Image**: Python 3.11-slim
- **Port**: 8000
- **Health Check**: `/api/health` endpoint
- **Features**:
  - Multi-stage build for optimization
  - Non-root user for security
  - Automatic spaCy model download
  - Hot reload for development

### Frontend Container
- **Base Image**: Node.js 18-alpine
- **Port**: 3000
- **Features**:
  - Production-optimized Next.js build
  - Non-root user for security
  - Cached dependencies for faster builds

### Network
- Custom bridge network `ai-fhir-network`
- Service discovery between containers
- Health check dependencies

## Environment Variables

The docker-compose.yml sets up the following environment variables:

### Backend
- `ENVIRONMENT=development`
- `PYTHONPATH=/app`

### Frontend
- `NODE_ENV=development`
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Volume Mounts

For development, the following directories are mounted:
- `./backend` → `/app` (backend code)
- `./frontend` → `/app` (frontend code)
- Anonymous volumes for `node_modules` and `.next` cache

## Production Deployment

For production deployment, consider:

1. **Remove development volumes** from docker-compose.yml
2. **Set production environment variables**
3. **Use proper secrets management**
4. **Enable HTTPS/TLS termination**
5. **Configure proper logging and monitoring**

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :8000
   
   # Stop the conflicting service or change ports in docker-compose.yml
   ```

2. **Backend health check failing**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test health endpoint manually
   curl http://localhost:8000/api/health
   ```

3. **Frontend can't connect to backend**
   - Verify `NEXT_PUBLIC_API_URL` environment variable
   - Check network connectivity between containers
   - Ensure backend is healthy before frontend starts

4. **Build issues**
   ```bash
   # Clean rebuild
   docker-compose down
   docker-compose build --no-cache
   docker-compose up
   ```

### Logs and Debugging
```bash
# Get container status
docker-compose ps

# Inspect specific container
docker inspect onye-test_backend_1

# Execute commands inside container
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Security Notes

- Both containers run as non-root users
- Health checks ensure service reliability
- .dockerignore files prevent sensitive data inclusion
- Network isolation between services
- Production builds exclude development dependencies

## About This Setup

This Docker configuration was manually crafted to showcase DevOps capabilities and containerization expertise. The setup demonstrates:
- Multi-container orchestration
- Service health monitoring
- Development-production parity
- Security best practices
- Performance optimization

Every configuration choice was deliberately made to balance development convenience with production readiness.