FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    docker-cli \
    jq

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs backlogs public

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8888/api/status || exit 1

# Start the application
CMD ["npm", "start"]