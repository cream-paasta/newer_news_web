FROM node:12-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --silent
COPY . .
CMD [ "node", "./bin/www" ]
EXPOSE 3000