# Пути
API_SRC        := docs/api.yaml
API_BUNDLED    := docs/api-bundled.yaml
RESOURCES_DIR  := resources
WEB_DOCS_DIR   := docs/web

migrate-up:
	@node index.js migrate up

migrate-down:
	@node index.js migrate down

run-service:
	@node index.js service run