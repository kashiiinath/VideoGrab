FROM node:20-bullseye-slim

# Install system dependencies: Python3, ffmpeg, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via pip (most reliable cross-platform installation)
RUN pip3 install --no-cache-dir yt-dlp

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
