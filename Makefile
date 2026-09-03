# Auto-parts inventory — Docker helpers.
#
# Two workflows:
#   Native dev (./manage.sh):   make infra   — starts just PostgreSQL + Elasticsearch
#   Full containerized stack:   make app     — builds and runs all four services
#
# Data lives in named volumes (pgdata, esdata) and survives `make down`.
# `make nuke` is the only target that deletes it.

COMPOSE := docker compose
PROFILE := --profile app

.DEFAULT_GOAL := help
.PHONY: help db es mailpit infra seed app stop down logs ps nuke health

help: ## Show this help
	@echo "Docker workflows (native dev stays in ./manage.sh):"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

db: ## Start PostgreSQL
	$(COMPOSE) up -d db

es: ## Start Elasticsearch (waits until it answers)
	$(COMPOSE) up -d elasticsearch
	@echo "Waiting for Elasticsearch..."
	@for i in $$(seq 1 60); do curl -sf -o /dev/null http://localhost:9200 && break; sleep 2; done
	@curl -sf -o /dev/null http://localhost:9200 && echo "Elasticsearch: http://localhost:9200" \
		|| { echo "Elasticsearch did not come up — try: docker compose logs elasticsearch"; exit 1; }

mailpit: ## Start Mailpit (dev email sink — inbox UI http://localhost:8025)
	$(COMPOSE) up -d mailpit

infra: db es mailpit ## Start the infra services native development needs

seed: ## One-shot dev seed against the db container (builds the image first)
	$(COMPOSE) build seed
	$(COMPOSE) --profile seed run --rm seed

app: ## Build + start the full stack (backend + frontend containers)
	$(COMPOSE) $(PROFILE) up -d --build
	@echo
	@echo "Stack:      http://localhost:3000   API: http://localhost:8080"
	@echo "Logs:       make logs S=backend   (or S=frontend / S=db / S=elasticsearch)"
	@echo "Shut down:  make down"

stop: ## Stop all containers (keep them for a fast restart)
	$(COMPOSE) $(PROFILE) stop

down: ## Stop and remove containers (data volumes are kept)
	$(COMPOSE) $(PROFILE) down

logs: ## Tail logs — make logs S=backend|frontend|db|elasticsearch|mailpit (default: all)
	$(COMPOSE) $(PROFILE) logs -f $(S)

ps: ## Show container status
	$(COMPOSE) $(PROFILE) ps

nuke: ## Stop and DELETE all data volumes (destructive!)
	@bash -c 'read -r -p "This deletes ALL database and search data. Type yes to confirm: " c; [ "$$c" = "yes" ]' \
		|| { echo "Aborted."; exit 1; }
	$(COMPOSE) $(PROFILE) down -v

health: ## Curl the backend health endpoint
	@curl -s http://localhost:8080/api/health && echo
