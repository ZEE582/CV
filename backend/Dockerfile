FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm install --global npm@11.21.2 --ignore-scripts && npm ci --ignore-scripts
COPY frontend frontend
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm install --global npm@11.21.2 --ignore-scripts && npm ci --ignore-scripts --omit=dev --workspace backend --include-workspace-root
COPY backend backend
COPY --from=build /app/frontend/dist frontend/dist
USER node
EXPOSE 5000
CMD ["node", "backend/server.js"]
