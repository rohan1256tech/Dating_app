# Development Stage
FROM node:20-alpine AS development
WORKDIR /app

COPY package*.json ./
# Install all dependencies (including dev tools like TypeScript)
RUN npm install

COPY . .
# Force Node to use up to 4GB RAM during build to prevent OOM in GCP Cloud Build
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Compile TypeScript to JavaScript in /dist
RUN npm run build

# Production Stage - Lean Image
FROM node:20-alpine AS production

# Set environment
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# Cloud Run defaults to port 8080 internally if not specified, but injects $PORT safely
ENV PORT=8080

WORKDIR /app

# Only install production dependencies for a smaller image size
COPY package*.json ./
RUN npm ci --only=production

# Copy the compiled JS from the development stage
COPY --from=development /app/dist ./dist

# Run as a non-root user for security (GCP Best Practice)
USER node

# Expose the port Cloud Run will use
EXPOSE 8080

CMD ["node", "dist/main"]
