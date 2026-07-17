#!/bin/bash

# Frontend configuration for crm.wealthempires.in
FRONTEND_PORT=5106
FRONTEND_IMAGE="crm-frontend"
FRONTEND_CONTAINER="crm-frontend-app"

# Backend configuration for crm.wealthempires.in
BACKEND_PORT=3351
BACKEND_IMAGE="crm-backend"
BACKEND_CONTAINER="crm-backend-app"

echo "================================================="
echo "Building and Deploying Frontend for crm..."
echo "================================================="
docker build -t $FRONTEND_IMAGE .
docker stop $FRONTEND_CONTAINER 2>/dev/null || true
docker rm $FRONTEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $FRONTEND_PORT:80 --name $FRONTEND_CONTAINER $FRONTEND_IMAGE

echo ""
echo "================================================="
echo "Building and Deploying Backend for crm..."
echo "================================================="
docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
docker stop $BACKEND_CONTAINER 2>/dev/null || true
docker rm $BACKEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $BACKEND_PORT:5001 --name $BACKEND_CONTAINER $BACKEND_IMAGE

echo ""
echo "================================================="
echo "Deployment Successful for crm.wealthempires.in!"
echo "Frontend: Port $FRONTEND_PORT (HTTP)"
echo "Backend: Port $BACKEND_PORT (API)"
echo "Containers are configured to restart automatically."
echo "================================================="
