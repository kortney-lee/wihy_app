#!/bin/sh
# Container health check script for WiHy UI

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if the application responds
if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "ERROR: Health endpoint not responding"
    exit 1
fi

# Check if main app loads
if ! curl -f http://localhost/ > /dev/null 2>&1; then
    echo "ERROR: Main application not responding"
    exit 1
fi

echo "OK: Container is healthy"
exit 0