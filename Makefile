.PHONY: server cli typecheck format

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
