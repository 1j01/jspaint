FROM node:lts

WORKDIR /app/nestjs

EXPOSE 8080

COPY . /app/nestjs

RUN npm install 

USER 1000

CMD ["npm", "run", "dev"]
