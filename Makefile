.PHONY: run typecheck format

run:
	@echo "Booting up the server..."
	@python -m src.main

typecheck:
	@echo "Typechecking the code..."
	@mypy src

format:
	@echo "Formatting the code..."
	@ruff src
