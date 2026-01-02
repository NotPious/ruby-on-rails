#!/bin/bash
set -e

# Remove a potentially pre-existing server.pid for Rails
rm -f /app/tmp/pids/server.pid

# Run database migrations (optional, can be done separately)
# bundle exec rails db:migrate 2>/dev/null || echo "Database migration skipped"

# Then exec the container's main process (what's set as CMD in the Dockerfile)
exec "$@"