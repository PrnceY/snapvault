deploy:
	git add .
	git commit -m "deploy update" || echo "no changes"
	git push origin main
	ssh s25101260@web.dcism.org "cd ~/snapvault.dcism.org && git pull origin main && bash deploy.sh"

.PHONY: deploy
