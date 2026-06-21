import os
import sys

# Get absolute path of root directory (parent of api/)
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

# Insert paths to sys.path so modules can be resolved
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import FastAPI app from backend package
from backend.main import app
