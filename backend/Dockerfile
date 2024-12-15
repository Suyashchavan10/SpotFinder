# Stage 1: Node.js base image
FROM node:20-alpine as node-stage

# Set the working directory for the Node.js application
WORKDIR /app

# Copy Node.js package files and install dependencies
COPY package*.json ./
RUN npm install

# Stage 2: Python base image (slim version)
FROM python:3.10-slim as python-stage

# Install required libraries for Python environment
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    libgl1 \
    libgl1-mesa-glx \
    libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Create a virtual environment and install Python dependencies
COPY src/requirements.txt .

# Stage 3: Final image (combining Node.js and Python environments)
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --upgrade pip && \
    /app/venv/bin/pip install -r requirements.txt

FROM python:3.10-slim

# Set the working directory for the combined app
WORKDIR /app

# Install Node.js (from node-stage) and required Python libraries (from python-stage)
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash && \
    apt-get install -y nodejs && \
    apt-get install -y libgl1 libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Copy the Node.js dependencies from node-stage
COPY --from=node-stage /app /app

# Copy the Python dependencies and virtual environment from python-stage
COPY --from=python-stage /app/venv /app/venv
COPY src/requirements.txt .

# Copy the rest of the application code
COPY . .

# Expose the port for the Node.js application
EXPOSE 5000

# Start the Node.js application
CMD ["node", "./src/index.js"]
