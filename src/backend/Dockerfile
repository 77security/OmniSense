# Use Node.js LTS
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies (including redis, express, pg, cookie-parser)
RUN npm ci --only=production

# Copy app source
COPY server.js .

# Expose the port SWA will talk to
EXPOSE 8080

# Run the application
CMD [ "node", "server.js" ]
