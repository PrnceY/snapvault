include .env
export

# SSH_HOST, SSH_PORT, SSH_USER, SSH_PASSWORD and DEPLOY_PATH come from .env
SSH_CMD = sshpass -p "$(SSH_PASSWORD)" ssh -p $(SSH_PORT) -o StrictHostKeyChecking=no $(SSH_USER)@$(SSH_HOST)

# 1. build the React app into backend/public (Express serves it from there)
build:
	cd frontend && npm install && npm run build -- --outDir ../backend/public --emptyOutDir

# 2. upload the backend (+ built frontend) and install its dependencies on the server
deploy: build
	@echo "Deploying SnapVault to $(SSH_HOST)..."
	@sshpass -p "$(SSH_PASSWORD)" \
		rsync -avz --checksum --chmod=F644,D755 -e "ssh -p $(SSH_PORT) -o StrictHostKeyChecking=no" \
		--exclude='.DS_Store' \
		--exclude='.env' \
		--exclude='node_modules' \
		--exclude='uploads' \
		./backend/ \
		"$(SSH_USER)@$(SSH_HOST):$(DEPLOY_PATH)/"
	@$(SSH_CMD) "cd $(DEPLOY_PATH) && npm install --omit=dev"
	@echo "Done. Restart the Node app on the server (see notes)."

.PHONY: build deploy
