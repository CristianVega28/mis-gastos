# Compila la app web de Expo y la sirve con nginx, que además reenvía /api a la API (API_UPSTREAM).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Misma URL que la web: nginx reenvía /api a la API
ENV EXPO_PUBLIC_API_URL=/api
RUN npx expo export -p web

FROM nginx:1.27-alpine
# Las plantillas de /etc/nginx/templates se procesan con envsubst al arrancar
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=^API_
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
