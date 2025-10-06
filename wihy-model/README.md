# wihy-model

## Overview
The "wihy-model" application is designed to provide a robust framework for building and evaluating machine learning models, particularly focusing on retrieval-augmented generation (RAG) techniques. This project includes various components such as model training, embedding generation, and evaluation.

## Project Structure
```
wihy-model
├── src
│   ├── __init__.py
│   ├── main.py
│   ├── models
│   │   └── __init__.py
│   ├── utils
│   │   └── __init__.py
│   └── config
│       └── __init__.py
├── tests
│   ├── __init__.py
│   └── test_main.py
├── requirements.txt
├── setup.py
└── README.md
```

## Setup Instructions
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd wihy-model
   ```

2. **Create a Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Copy the `.env.example` file to `.env` and fill in the necessary environment variables.

## Usage
To run the application, execute the following command:
```bash
python src/main.py
```

## Testing
To run the tests, use:
```bash
pytest tests/
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.