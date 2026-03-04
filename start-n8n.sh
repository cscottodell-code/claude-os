#!/bin/bash
# Start n8n in development mode
# Data is stored in ~/.n8n so it persists between restarts

echo "Starting n8n..."
echo "Web interface: http://localhost:5678"
echo "Press Ctrl+C to stop"
echo ""

n8n start
