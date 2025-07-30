# Dockerfile para aplicación React con Vite y Tailwind CSS

# Etapa 1: Build
FROM node:18-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm ci --only=production

# Copia el código fuente
COPY . .

# Construye la aplicación
RUN npm run build

# Etapa 2: Producción con nginx
FROM nginx:alpine

# Copia la aplicación construida desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia la configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 2502
EXPOSE 2502

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]