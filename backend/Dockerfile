# ---------- Base: Node.js + Python + Tesseract + Puppeteer ----------
FROM node:20-slim

# Install system packages for Python, Tesseract, and Chromium
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    tesseract-ocr \
    libglib2.0-0 \
    libnss3 \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libx11-xcb1 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    xdg-utils \
    wget \
    chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set Puppeteer Chromium path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose app port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
