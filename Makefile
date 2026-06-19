SSH_HOST=web.dcism.org
SSH_PORT=22077
SSH_USER=s25101260

DEPLOY_PUBLIC_PATH=home/s25101260/snapvault.dcism.org/public

deploy:
	@echo "Deploying to $(SSH_HOST)..."
	@sshpass -p "$(SSH_PASSWORD)" \
	rsync -avz --delete \
	-e "ssh -p $(SSH_PORT)" \
	--chmod=u+w \
	./public/ \
	"$(SSH_USER)@$(SSH_HOST):$(DEPLOY_PUBLIC_PATH)/"

.PHONY: deploy