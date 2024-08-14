# Stage 1: SDK Generation with Java
FROM openjdk:11 AS sdk-gen

WORKDIR /build


# Install Node.js and NPM in the Java image
RUN apt-get update && apt-get install -y nodejs npm

# Copy package files
COPY *.json ./
# Copy the OpenAPI spec -  platform-api/openapi.yml
COPY platform-api/openapi.yml ./platform-api/openapi.yml

# Install dependencies
RUN npm ci

# Run the SDK generation
RUN npm run generate-sdk

# Copy the source files to the working directory
COPY src ./src

# Build the TypeScript source
RUN npm run build

RUN ls -lah .

# Stage 2: Final Application Image
FROM node:18-alpine AS app

# Set the working directory to /app
WORKDIR /app

# Expose port 3000 on the container
EXPOSE 3000

# Copy the build files from the previous stage
COPY --from=sdk-gen /build/build ./build

# Copy node_modules from the previous stage
COPY --from=sdk-gen /build/node_modules ./node_modules

# We copy the package JSON too so node knows this is a module
COPY package.json ./

# Test the build output exists
RUN cat build/src/client/server.js

# Start the application
CMD ["node", "build/src/client/server.js"]