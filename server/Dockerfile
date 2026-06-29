FROM node:20-alpine

WORKDIR /app

# Install deps first for better caching
COPY package*.json./
RUN npm ci --only=production

# Copy source code
COPY..

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "server.js"]