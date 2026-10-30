FROM node:20-bullseye-slim

# Install system dependencies: Python3, ffmpeg, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    || pip3 install --no-cache-dir yt-dlp --break-system-packages

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source files and config
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

# Build TypeScript to dist/
RUN npm run build

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
