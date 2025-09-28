FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    postgresql-client \
    redis-tools \
    docker.io \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/reports /app/screenshots /app/videos /app/traces

# Install Playwright browsers
RUN npx playwright install chromium

# Set permissions
RUN chmod +x /app/entrypoint.sh

# Expose ports
EXPOSE 8888 8000

CMD ["node", "src/index.js"]