FROM node:20-alpine AS deps
WORKDIR /app
# hadolint ignore=DL3018
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
# hadolint ignore=DL3018
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
RUN mkdir -p /data && chown node:node /data
EXPOSE 8080
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
