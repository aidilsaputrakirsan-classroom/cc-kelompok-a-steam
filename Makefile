.PHONY: lint test pr-check up down logs build clean restart

# Menjalankan linter untuk menjaga kualitas kode (frontend ESLint)
lint:
	@echo "Menjalankan linter..."
	cd frontend && npm run lint
	@echo "Linting selesai."

# Menjalankan automated tests untuk backend, ai-service, dan frontend
test:
	@echo "Menjalankan testing..."
	@echo "--- Backend Tests ---"
	cd backend && pytest
	@echo "--- AI Service Tests ---"
	cd services/ai-service && pytest tests/ -v --tb=short
	@echo "--- Frontend Tests ---"
	cd frontend && npm test
	@echo "Testing selesai."

# Simulasi PR Check: Linter, Test, dan Build Docker Image
pr-check: lint test
	@echo "Menjalankan PR check..."
	docker compose build
	@echo "PR check berhasil. Kode siap di-merge!"

# ==========================================
# Docker Shortcut Commands
# ==========================================

# Menjalankan semua services di background
up:
	docker compose up -d

# Mematikan semua services
down:
	docker compose down

# Menampilkan logs dari semua services
logs:
	docker compose logs -f

# Melakukan build ulang image
build:
	docker compose build

# Membersihkan container, network, dan volume
clean:
	docker compose down -v
	@echo "Membersihkan resource docker yang tidak terpakai..."
	docker system prune -f

# Melakukan restart semua services
restart:
	docker compose restart
