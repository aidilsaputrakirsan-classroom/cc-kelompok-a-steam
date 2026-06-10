#!/bin/bash
# ==============================================================================
# Log helper script untuk debugging microservices
# Modul 14: Monitoring, Logging & Observability
# Usage: ./scripts/logs.sh [command] [args]
# ==============================================================================

case "$1" in
  all)
    echo "📋 Showing all service logs..."
    docker compose logs -f auth-service ai-service
    ;;
  errors)
    echo "❌ Showing ERROR logs only..."
    docker compose logs auth-service ai-service 2>&1 | grep '"level":"ERROR"'
    ;;
  trace)
    if [ -z "$2" ]; then
      echo "Usage: ./scripts/logs.sh trace <correlation-id>"
      exit 1
    fi
    echo "🔗 Tracing correlation ID: $2"
    docker compose logs auth-service ai-service 2>&1 | grep "$2"
    ;;
  metrics)
    echo "📊 Fetching metrics..."
    echo "--- Auth Service ---"
    curl -s http://localhost/auth/metrics | python -m json.tool
    echo ""
    echo "--- AI Service ---"
    curl -s http://localhost/chat/metrics | python -m json.tool
    ;;
  *)
    echo "Usage: ./scripts/logs.sh {all|errors|trace <id>|metrics}"
    ;;
esac
