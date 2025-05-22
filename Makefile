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

docs-gen:
	@echo "📦 Bundling OpenAPI spec from $(API_SRC) → $(API_BUNDLED)…"
	@swagger-cli bundle $(API_SRC) \
		--outfile $(API_BUNDLED) \
		--type yaml
	@echo "✅ Bundled spec written to $(API_BUNDLED)"