# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

# Runtime environment variables (override at deploy time)
ENV PORT=3001
ENV FRONTEND_URL=https://podfolio-two.vercel.app
ENV ALLOWED_ORIGINS=https://podfolio-two.vercel.app
# EXPRESS_SERVER_URL must be set to the public URL of this service (e.g., https://your-service.onrender.com)
# The backend uses this to construct canvas URLs and for MCP connections

CMD ["node", "dist/service.js"]