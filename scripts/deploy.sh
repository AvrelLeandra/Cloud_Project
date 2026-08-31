#!/bin/bash
# Shell script to deploy Smart Fleet Azure Infrastructure via Azure CLI & Bicep

LOCATION=${1:-"eastus"}
ENV=${2:-"dev"}

echo "=== Smart Fleet Azure Infrastructure Deployment ==="
echo "Location: $LOCATION | Environment: $ENV"

az deployment sub create \
  --name "SmartFleetDeployment-$(date +%Y%m%d%H%M%S)" \
  --location "$LOCATION" \
  --template-file infra/main.bicep \
  --parameters infra/parameters.json

echo "Deployment successful!"
