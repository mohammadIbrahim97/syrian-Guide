# Use a base image that contains both Python 3.11 and Node.js 20
FROM nikolaik/python-nodejs:python3.11-nodejs20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements first for caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy package.json and package-lock.json (if they exist, else we'll initialize them)
# Using wildcard to not crash if package.json doesn't exist yet during initial setup
COPY package*.json ./

# Install Node dependencies (if package.json is present)
RUN if [ -f package.json ]; then npm install; fi

# Copy project files
COPY . .

# Expose Next.js default port and Python FastAPI port
EXPOSE 3000
EXPOSE 8000

# Set environment to development
ENV NODE_ENV=development

# By default, start Next.js in dev mode
CMD ["npm", "run", "dev"]
