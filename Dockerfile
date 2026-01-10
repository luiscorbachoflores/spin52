# Stage 1: Build Frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Setup Backend and Serve
FROM node:18-alpine
WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend code
COPY backend/ .

# Copy built frontend assets to a location backend can serve
# (Assuming backend/server.js serves from ../frontend/dist)
# We will copy it to /app/frontend/dist so the relative path works
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
