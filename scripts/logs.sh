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
    
    # Deteksi parser python yang tersedia
    PYTHON_CMD=""
    if command -v python3 >/dev/null 2>&1; then
      PYTHON_CMD="python3"
    elif command -v python >/dev/null 2>&1; then
      PYTHON_CMD="python"
    fi

    echo "--- Auth Service ---"
    if [ -n "$PYTHON_CMD" ]; then
      curl -s http://localhost/auth/metrics | "$PYTHON_CMD" -m json.tool
    else
      curl -s http://localhost/auth/metrics
    fi
    echo ""
    echo ""
    echo "--- AI Service ---"
    if [ -n "$PYTHON_CMD" ]; then
      curl -s http://localhost/chat/metrics | "$PYTHON_CMD" -m json.tool
    else
      curl -s http://localhost/chat/metrics
    fi
    ;;
  *)
    echo "Usage: ./scripts/logs.sh {all|errors|trace <id>|metrics}"
    ;;
esac
