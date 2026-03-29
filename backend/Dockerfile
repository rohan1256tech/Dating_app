FROM node:20-alpine AS builder

WORKDIR /app

# Increase memory for nest build — critical for large NestJS apps
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]