.PHONY: client start-redis celery server cli typecheck format

client:
	@echo "Booting up the client..."
	@cd client && npm start

build:
	@echo "Building the server image..."
	@docker build -t michaelfromyeg/bereal_wrapped -f docker/Dockerfile.server .
	@docker push michaelfromyeg/bereal_wrapped

up:
	@echo "Booting up the server..."
	@docker stack deploy -c docker-stack.local.yml bereal-wrapped

logs:
	@echo "Showing the server logs..."
	@docker service logs -f bereal-wrapped_web

down:
	@echo "Shutting down the server..."
	@docker stack rm bereal-wrapped

start-redis:
	@echo "Booting up Redis..."
	@redis-server

check-redis:
	@echo "Checking Redis..."
	@redis-cli ping

stop-redis:
	@echo "Shutting down Redis..."
	@redis-cli shutdown

celery:
	@echo "Booting up Celery..."
	@celery -A bereal.celery worker --loglevel=DEBUG --logfile=celery.log -E

flower:
	@echo "Booting up Flower..."
	@celery -A bereal.celery flower --address=0.0.0.0 --inspect --enable-events --loglevel=DEBUG --logfile=flower.log

server:
	@echo "Booting up the server..."
	@python -m bereal.server

cli:
	@echo "Booting up the CLI..."
	@python -m bereal.cli

typecheck:
	@echo "Typechecking the code..."
	@mypy bereal

format:
	@echo "Formatting the code..."
	@ruff bereal
