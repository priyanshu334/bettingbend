# Base image
FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Expose the app port
EXPOSE 5000

# Start with PM2
CMD ["pm2-runtime", "index.js"]
