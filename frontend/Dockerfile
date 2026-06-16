FROM node:23-alpine AS builder

ARG REACT_APP_API_BASE=http://localhost:8000
ARG REACT_APP_BACKEND_URL=http://localhost:5001
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY package*.json ./

RUN chown -R node:node /home/node/app

USER node

COPY --chown=node:node . .

RUN npm install && npm run build


FROM bitnami/nginx:latest

COPY --from=builder /home/node/app/build /app/
