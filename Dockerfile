FROM node:20.11.1-bookworm

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm ci

# Bundle app source
COPY . .

RUN chmod +x start.sh

RUN rm .env.local

CMD ["./start.sh"]

# Expose port 3000
EXPOSE 3000