# Compila la web de Expo y deja solo el dist, que sirve Caddy (deploy/Caddyfile).
# Uso: deploy/build-web.sh  (o: docker build -f deploy/web.Dockerfile --target export --output type=local,dest=/var/www/mis-gastos .)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Misma URL que la web: Caddy reenvía /api a la API
ENV EXPO_PUBLIC_API_URL=/api
RUN npx expo export -p web

# scratch es una imagen vacía: aquí solo quedan los archivos del dist
FROM scratch AS export
COPY --from=build /app/dist /
