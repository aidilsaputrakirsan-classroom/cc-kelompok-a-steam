.PHONY: lint test pr-check up down logs build clean restart

# Menjalankan linter untuk menjaga kualitas kode
lint:
	@echo "Menjalankan linter..."
	@echo "[!] Linter backend (placeholder)"
	@echo "[!] Linter frontend (placeholder)"
	@echo "Linting selesai."

# Menjalankan automated tests
test:
	@echo "Menjalankan testing..."
	@echo "[!] Unit test (placeholder)"
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
