FROM node:24-slim

WORKDIR /app

# Esto asegura que npm instale solo prod deps
ENV NODE_ENV=production
# Esto evita que "prepare" intente correr husky
ENV HUSKY=0

COPY package*.json ./

RUN npm ci --omit=dev  --ignore-scripts

COPY src ./src
COPY nodemon.json ./
COPY README.md ./


EXPOSE 3000

CMD ["npm", "start"]
