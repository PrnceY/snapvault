#!/bin/bash

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Restarting app..."
pm2 restart all || echo "No pm2 found"

echo "Deployment complete."#!/bin/bash

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies (if any)..."
npm install

echo "Restarting app..."
pm2 restart all || echo "No pm2 process found"

echo "Deployment complete."
