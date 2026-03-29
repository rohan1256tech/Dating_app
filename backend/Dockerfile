# Development Stage
FROM node:20 AS development
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🔥 Use tsc instead of nest build for lightweight compilation
RUN npx tsc

# Production Stage
FROM node:20

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=development /app/dist ./dist

USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]
