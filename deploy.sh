#!/bin/bash

# Frontend configuration
FRONTEND_PORT=5105
FRONTEND_IMAGE="we-crm"
FRONTEND_CONTAINER="we-crm-app"

# Backend configuration
BACKEND_PORT=3350
BACKEND_IMAGE="we-crm-backend"
BACKEND_CONTAINER="we-crm-backend-app"

echo "================================================="
echo "Building and Deploying Frontend..."
echo "================================================="
docker build -t $FRONTEND_IMAGE .
docker stop $FRONTEND_CONTAINER 2>/dev/null || true
docker rm $FRONTEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $FRONTEND_PORT:80 --name $FRONTEND_CONTAINER $FRONTEND_IMAGE

echo ""
echo "================================================="
echo "Building and Deploying Backend..."
echo "================================================="
docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
docker stop $BACKEND_CONTAINER 2>/dev/null || true
docker rm $BACKEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $BACKEND_PORT:5001 --name $BACKEND_CONTAINER $BACKEND_IMAGE

echo ""
echo "================================================="
echo "Deployment Successful!"
echo "Frontend: Port $FRONTEND_PORT (HTTP)"
echo "Backend: Port $BACKEND_PORT (API)"
echo "Containers are configured to restart automatically."
echo "================================================="
