FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ openssl
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY package.json ./
COPY src ./src
COPY prisma ./prisma
RUN mkdir -p /data/uploads && chown -R app:app /app /data
USER app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/data/uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
