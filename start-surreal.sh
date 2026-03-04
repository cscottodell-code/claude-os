#!/bin/bash
# Start SurrealDB in development mode
# Data is stored in ~/Sites/surreal-data so it persists between restarts

# Create data directory if it doesn't exist
mkdir -p ~/Sites/surreal-data

echo "Starting SurrealDB..."
echo "Web interface: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

surreal start \
  --user root \
  --pass root \
  --bind 0.0.0.0:8000 \
  file://~/Sites/surreal-data
