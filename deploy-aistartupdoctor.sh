#!/bin/bash

# Frontend configuration (React App at root https://aistartupdoctor.com)
FRONTEND_PORT=5108
FRONTEND_IMAGE="aistartupdoctor-frontend"
FRONTEND_CONTAINER="aistartupdoctor-frontend-app"

# CRM configuration (Angular App at https://aistartupdoctor.com/crm/)
CRM_PORT=5107
CRM_IMAGE="aistartupdoctor-crm"
CRM_CONTAINER="aistartupdoctor-crm-app"

# Backend configuration (Node.js API at https://aistartupdoctor.com/api/)
BACKEND_PORT=3352
BACKEND_IMAGE="aistartupdoctor-backend"
BACKEND_CONTAINER="aistartupdoctor-backend-app"

echo "================================================="
echo "Building and Deploying React Frontend (aistartupdoctor.com)..."
echo "================================================="
docker build -f Dockerfile.aistartupdoctor-frontend -t $FRONTEND_IMAGE .
docker stop $FRONTEND_CONTAINER 2>/dev/null || true
docker rm $FRONTEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $FRONTEND_PORT:80 --name $FRONTEND_CONTAINER $FRONTEND_IMAGE

echo ""
echo "================================================="
echo "Building and Deploying Angular CRM (/crm/)..."
echo "================================================="
docker build -f Dockerfile.aistartupdoctor-crm -t $CRM_IMAGE .
docker stop $CRM_CONTAINER 2>/dev/null || true
docker rm $CRM_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $CRM_PORT:80 --name $CRM_CONTAINER $CRM_IMAGE

echo ""
echo "================================================="
echo "Building and Deploying Node.js Backend (/api/)..."
echo "================================================="
docker build -f Dockerfile.aistartupdoctor-backend -t $BACKEND_IMAGE .
docker stop $BACKEND_CONTAINER 2>/dev/null || true
docker rm $BACKEND_CONTAINER 2>/dev/null || true
docker run -d --restart unless-stopped -p $BACKEND_PORT:5001 --name $BACKEND_CONTAINER $BACKEND_IMAGE

echo ""
echo "================================================="
echo "Deployment Successful for aistartupdoctor.com!"
echo "React Frontend: Port $FRONTEND_PORT -> https://aistartupdoctor.com"
echo "Angular CRM:    Port $CRM_PORT      -> https://aistartupdoctor.com/crm/"
echo "Node Backend:   Port $BACKEND_PORT  -> https://aistartupdoctor.com/api/"
echo "Containers are configured to restart automatically."
echo "================================================="
