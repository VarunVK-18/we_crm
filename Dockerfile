# Stage 1: Build the Angular frontend application
FROM node:20-alpine as build
WORKDIR /app

# Copy package files and install dependencies
# We are copying from the 'webpage' directory in your project root
COPY webpage/package.json webpage/package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend application source code
COPY webpage/ ./
RUN npm run build -- --configuration production

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
# Note: Angular 17+ outputs to dist/<project-name>/browser. 
COPY --from=build /app/dist/webpage/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (this matches the port mapped in deploy.sh)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
