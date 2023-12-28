.PHONY: run lint typecheck format

run:
	@echo "Booting up the server..."
	@python -m src.main

lint:
	@echo "Linting the code..."
	@pylint src

typecheck:
	@echo "Typechecking the code..."
	@mypy src

format:
	@echo "Formatting the code..."
	@ruff src
