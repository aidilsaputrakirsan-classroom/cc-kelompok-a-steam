feat: add CI pipeline with automated testing

- Add GitHub Actions workflow: test-backend, test-frontend, build-docker
- Add pytest tests: auth (4), items (7), health (1) = 12 tests
- Add Vitest tests: Header (2), ItemCard (3), API (2) = 7 tests
- Configure pytest with coverage threshold 50%
- Jobs run in parallel, Docker build requires tests to pass"