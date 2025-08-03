FROM node:20-slim

# Install dependencies: Python, Chromium, Tesseract, system libs
RUN apt-get update && apt-get install -y \
    python3 python3-venv python3-pip \
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

# Create app directory
WORKDIR /app

# Copy Node dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy Python requirements and install in a venv
COPY requirements.txt ./
RUN python3 -m venv /app/venv \
    && . /app/venv/bin/activate \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy app source code
COPY . .

# Ensure virtualenv is used in runtime
ENV PATH="/app/venv/bin:$PATH"

# Expose port for Render
EXPOSE 3000

# Start Node server
CMD ["node", "server.js"]
