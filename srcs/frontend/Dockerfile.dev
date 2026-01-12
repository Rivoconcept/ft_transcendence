# Dockerfile.dev (frontend)
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm

EXPOSE 5173

# Install dependencies on startup and run dev server
CMD ["sh", "-c", "pnpm install && pnpm dev --host 0.0.0.0"]
