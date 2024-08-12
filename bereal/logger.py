"""
A custom logger.
"""

import logging
import logging.config

logging.config.fileConfig(fname="logger.ini", disable_existing_loggers=False)

logger = logging.getLogger("berealLogger")

logger.debug("Hello, world!")
