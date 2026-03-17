FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY server.mjs .

EXPOSE 8080

ENV PORT=8080

CMD ["node", "server.mjs"]
