FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Make index.js executable
RUN chmod +x index.js

# Default command
CMD ["node", "index.js"]
