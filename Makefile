.PHONY: lint test pr-check

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
