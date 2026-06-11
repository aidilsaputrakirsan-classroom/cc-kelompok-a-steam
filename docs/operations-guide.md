# Operations Guide — Production Monitoring & Troubleshooting

## Quick Reference

### Health Check

```bash
# Gateway health
curl http://localhost/health

# Auth Service health
curl http://localhost/auth/health

# AI Service health
curl http://localhost/items/health
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth-service

# Last 50 lines
docker compose logs --tail=50

# Real-time with timestamps
docker compose logs -f --timestamps
```

### Metrics Monitoring

```bash
# Auth Service metrics
curl http://localhost/auth/metrics | python3 -m json.tool

# AI Service metrics
curl http://localhost/items/metrics | python3 -m json.tool

# Check specific metric (requests)
curl -s http://localhost/auth/metrics | python3 -c "import sys, json; print('Total Requests:', json.load(sys.stdin)['total_requests'])"
```

### Status Dashboard

- Open browser: `http://localhost/status`
- Real-time health and metrics for all services
- Auto-refresh every 10 seconds

---

## Troubleshooting Guide

### Problem: "Connection refused" on localhost

**Solution:**

```bash
# Verify containers are running
docker compose ps

# Start if not running
docker compose up -d

# Check if ports are listening
docker compose port frontend
docker compose port auth-service
```

### Problem: Auth Service is down

**Symptoms:**

- `curl http://localhost/auth/health` returns error
- Users can't login or register
- 503 Service Unavailable errors

**Solution:**

```bash
# Check logs for errors
docker compose logs auth-service --tail=50

# Restart the service
docker compose restart auth-service

# Or rebuild if images changed
docker compose up -d --build auth-service

# Verify database connection
docker compose logs auth-service | grep -i "database\|connection"
```

### Problem: AI Service is down

**Symptoms:**

- Chat features not working
- AI processing fails
- `/items/health` returns error

**Solution:**

```bash
# Check logs
docker compose logs ai-service --tail=50

# Check if it's trying to reach Auth Service
docker compose logs ai-service | grep -i "auth"

# Restart and rebuild
docker compose up -d --build ai-service

# Verify container is healthy
docker compose exec ai-service curl http://localhost:8002/health
```

### Problem: Database connection errors

**Symptoms:**

- "could not connect to server" in logs
- 500 Internal Server Error on API calls

**Solution:**

```bash
# Check database containers
docker compose ps | grep -db

# Check database logs
docker compose logs auth-db
docker compose logs item-db

# Restart databases
docker compose restart auth-db item-db

# Wait for databases to be ready (30 seconds)
sleep 30
docker compose up -d

# Verify database connections from services
docker compose exec auth-service python3 -c "from database import engine; engine.execute('SELECT 1')"
```

### Problem: High error rate (> 5%)

**Steps:**

1. Check which service is experiencing errors:

   ```bash
   curl -s http://localhost/auth/metrics | grep error_rate_percent
   curl -s http://localhost/items/metrics | grep error_rate_percent
   ```

2. View error logs from affected service:

   ```bash
   docker compose logs auth-service 2>&1 | grep '"level":"ERROR"'
   ```

3. Check specific request with correlation ID:
   ```bash
   # From logs, find a correlation_id, then:
   docker compose logs | grep "YOUR_CORRELATION_ID"
   ```

### Problem: Slow response times (latency > 1 second)

**Investigation:**

```bash
# Check p95 and p99 latency
curl -s http://localhost/auth/metrics | python3 -c "import sys, json; m = json.load(sys.stdin); print('P95:', m['latency']['p95_ms'], 'P99:', m['latency']['p99_ms'])"

# Check CPU/Memory usage
docker stats

# Check slow queries in database logs
docker compose logs auth-db | grep "slow query"

# Check if other processes are using resources
docker compose top auth-service
```

**Solutions:**

- Restart services if memory keeps growing
- Check database indexes if queries are slow
- Increase container resource limits in docker-compose.yml
- Scale horizontally if needed (multiple instances)

---

## Monitoring Best Practices

### Daily Checks

```bash
# Morning: Check all services are healthy
for service in auth-service ai-service; do
  STATUS=$(curl -s http://localhost/${service#auth-}/health | grep -o '"status":"[^"]*"')
  echo "$(date '+%H:%M:%S') $service: $STATUS"
done

# Check error rates
curl -s http://localhost/auth/metrics | grep -o '"error_rate_percent":[^,}]*'
```

### Weekly Review

```bash
# Collect metrics for analysis
mkdir -p logs/weekly-$(date +%Y-W%V)

# Export logs
docker compose logs --no-color > logs/weekly-$(date +%Y-W%V)/all-services.log

# Export metrics
curl -s http://localhost/auth/metrics > logs/weekly-$(date +%Y-W%V)/auth-metrics.json
curl -s http://localhost/items/metrics > logs/weekly-$(date +%Y-W%V)/items-metrics.json

# Analyze
echo "Auth Service - Weekly Summary:"
echo "Total Requests: $(grep -o '"total_requests":[^,}]*' logs/weekly-$(date +%Y-W%V)/auth-metrics.json)"
echo "Error Rate: $(grep -o '"error_rate_percent":[^,}]*' logs/weekly-$(date +%Y-W%V)/auth-metrics.json)"
```

### Production Alerts (should be configured)

| Metric              | Threshold | Action                     |
| ------------------- | --------- | -------------------------- |
| Error Rate          | > 5%      | Investigate immediately    |
| Response Time (p95) | > 1000ms  | Check database performance |
| Service Down        | Any       | Restart service            |
| Disk Usage          | > 80%     | Clean old logs             |
| Memory Usage        | > 85%     | Restart containers         |

---

## Log Analysis

### Filter logs by level

```bash
# ERROR logs only
docker compose logs 2>&1 | grep '"level":"ERROR"'

# WARNING logs
docker compose logs 2>&1 | grep '"level":"WARNING"'

# Specific service and level
docker compose logs auth-service 2>&1 | grep '"level":"ERROR"'
```

### Trace a request flow

```bash
# From status page, note the correlation ID
# Then:
CORR_ID="your-correlation-id"
echo "Tracing request $CORR_ID..."
docker compose logs 2>&1 | grep "$CORR_ID" | python3 -m json.tool
```

### Find performance bottlenecks

```bash
# Find slowest requests (latency > 500ms)
docker compose logs 2>&1 | grep -E '"duration_ms":[5-9][0-9]{2,}' | python3 -m json.tool

# Find endpoints with most requests
docker compose logs 2>&1 | grep '"path"' | grep -o '"path":"[^"]*"' | sort | uniq -c | sort -rn
```

---

## Scaling & Performance

### Horizontal Scaling (add more instances)

```bash
# In docker-compose.yml, replicate auth-service:
# auth-service-1, auth-service-2, etc.
# Add load balancer in Nginx

# Then restart
docker compose up -d
```

### Vertical Scaling (increase resources)

```yaml
# In docker-compose.yml:
auth-service:
  # ... other config ...
  deploy:
    resources:
      limits:
        cpus: "0.5" # Increase from 0.25
        memory: 512M # Increase from 256M
      reservations:
        cpus: "0.25"
        memory: 256M
```

### Database Optimization

```bash
# Check index usage
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM pg_stat_user_indexes;"

# Check table sizes
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## Incident Response

### Service Recovery Checklist

1. ✓ Check service status: `docker compose ps`
2. ✓ View recent logs: `docker compose logs --tail=100`
3. ✓ Identify root cause (database? dependency? resource?)
4. ✓ Restart if transient: `docker compose restart SERVICE_NAME`
5. ✓ Rebuild if config changed: `docker compose up -d --build SERVICE_NAME`
6. ✓ Verify recovery: Check `/health` and `/metrics`
7. ✓ Document incident for review

### Escalation Path

- **Level 1 (Automatic)**: Service restart via orchestrator
- **Level 2 (DevOps)**: Check logs, restart containers, check resource usage
- **Level 3 (Backend Lead)**: Debug code, check database, review recent changes
- **Level 4 (Whole Team)**: Architecture review, capacity planning

---

## Useful Commands Reference

```bash
# System status
docker compose ps
docker compose stats

# Logs
docker compose logs -f [service]
docker compose logs --tail=N [service]

# Service management
docker compose up -d [service]
docker compose down [service]
docker compose restart [service]
docker compose exec [service] [command]

# Database access
docker compose exec auth-db psql -U postgres
docker compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM users;"

# Rebuild
docker compose build [service]
docker compose up -d --build [service]

# Network debugging
docker compose exec [service] curl http://auth-service:8001/health

# Health check
for s in auth-service ai-service; do
  curl -s http://localhost/${s#auth-}/health | grep status
done
```

---

## Contact & Escalation

| Issue               | Contact               | Slack          |
| ------------------- | --------------------- | -------------- |
| Backend down        | Lead Backend          | @backend-team  |
| Frontend issues     | Lead Frontend         | @frontend-team |
| Deployment failed   | Lead DevOps           | @devops-team   |
| Database corruption | Lead Backend + DevOps | @incident      |

---

**Last Updated:** 2026-02-15  
**Version:** 1.0 (Production Ready)
