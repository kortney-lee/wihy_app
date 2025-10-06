# main.py

import os
from src.api.main import initialize_app

if __name__ == "__main__":
    app = initialize_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port)