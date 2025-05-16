# Пути
API_SRC        := docs/api.yaml
API_BUNDLED    := docs/api-bundled.yaml
RESOURCES_DIR  := resources
WEB_DOCS_DIR   := docs/web

bundle-spec:
	@echo "🔗 Bundling OpenAPI spec..."
	@swagger-cli bundle $(API_SRC) \
		--outfile $(API_BUNDLED) \
		--type yaml

generate-resources: bundle-spec
	@echo "🗑  Cleaning up $(RESOURCES_DIR)/ and $(WEB_DOCS_DIR)/..."
	@find $(RESOURCES_DIR) -mindepth 1 -exec rm -rf {} +
	@find $(WEB_DOCS_DIR)  -mindepth 1 -exec rm -rf {} +

	@mkdir -p $(RESOURCES_DIR) $(WEB_DOCS_DIR)

	@echo "🤖 Generating JS resources into $(RESOURCES_DIR)/..."
	@openapi-generator-cli generate \
		-i $(API_BUNDLED) \
		-g javascript \
		-o $(RESOURCES_DIR) \
		--skip-validate-spec \
		--additional-properties=usePromises=true

	@echo "🚮 Removing OpenAPI Generator metadata…"
	@rm -rf $(RESOURCES_DIR)/.openapi-generator

	@echo "📁 Moving non-transport files to $(WEB_DOCS_DIR)/..."
	@find $(RESOURCES_DIR) -mindepth 1 -maxdepth 1 \
	   ! -name src \
	   ! -name test \
	   ! -name '.*' \
	   -exec mv {} $(WEB_DOCS_DIR)/ \;

	@echo "✅ Generation complete."

migrate-up:
	@node index.js migrate up

migrate-down:
	@node index.js migrate down

run-service:
	@node index.js service run