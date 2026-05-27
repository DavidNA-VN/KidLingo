FROM node:22-slim

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
