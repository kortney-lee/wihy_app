# wihy-model

## Overview
The `wihy-model` project is a Python-based API and machine learning model application designed to provide predictions based on input data. It utilizes FastAPI for the web framework and includes various components for model management, data preprocessing, and API routing.

## Project Structure
```
wihy-model
├── src
│   ├── api                # API related code
│   ├── models             # Machine learning models and preprocessing
│   ├── services           # Business logic for predictions
│   └── utils              # Utility functions and configurations
├── tests                  # Unit tests for the application
├── data                   # Data storage for raw and processed data
├── notebooks              # Jupyter notebooks for analysis
├── requirements.txt       # Project dependencies
├── requirements-dev.txt   # Development dependencies
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore file
├── Dockerfile             # Docker configuration
└── docker-compose.yml     # Docker Compose configuration
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd wihy-model
   ```

2. **Create a Virtual Environment**
   It is recommended to create a virtual environment to manage dependencies.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   Install the required packages using pip.
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Up Environment Variables**
   Copy the `.env.example` to `.env` and fill in the necessary environment variables.
   ```bash
   cp .env.example .env
   ```

5. **Run the Application**
   Start the FastAPI application.
   ```bash
   uvicorn src.api.main:app --reload
   ```

## Usage
Once the application is running, you can access the API at `http://localhost:8000`. The API documentation is available at `http://localhost:8000/docs`.

## Testing
To run the tests, ensure your virtual environment is activated and execute:
```bash
pytest
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.