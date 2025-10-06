FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements files
COPY requirements.txt requirements-dev.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy the application code
COPY ./src ./src
COPY ./tests ./tests
COPY .env.example .env.example
COPY .gitignore .gitignore
COPY README.md README.md

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]