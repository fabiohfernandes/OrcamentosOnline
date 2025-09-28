FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache \
    chromium \
    curl \
    bash \
    docker-cli \
    jq \
    bc

# Set up Chrome/Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright with Chrome
RUN npx playwright install chromium

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs reports data

# Make scripts executable (if any exist)
RUN find . -name "*.sh" -exec chmod +x {} \; || true

# Default command
CMD ["npm", "start"]