# Dockerfile

# Use node alpine as it's a small node image
FROM node:22-alpine

# Create the directory on the node image 
# where our Next.js app will live
RUN mkdir -p /app

# Set /app as the working directory
WORKDIR /app

# Copy package.json and package-lock.json
# to the /app working directory
COPY package*.json /app

# Install dependencies in /app
RUN npm install

# Copy the rest of our Next.js folder into /app
COPY . /app

# Ensure port 3000 is accessible to our system
EXPOSE 3000

ENV PATH /app/node_modules/.bin:$PATH

# Run yarn dev, as we would via the command line 
CMD ["npm", "run", "next-dev"]

# # bundle static assets with nginx
# FROM nginx:1.21.0-alpine as production

# ENV ENVIRONMENT ${ENVIRONMENT}
# # remove existing files from nginx directory
# RUN rm -rf /usr/share/nginx/html/*
# # copy built assets from 'builder' stage
# COPY --from=builder /usr/src/next-nginx/out /usr/share/nginx/html
# # add nginx config
# COPY default.conf /etc/nginx/conf.d/default.conf
# # expose port 80 for nginx
# EXPOSE 80
# # start nginx
# CMD ["nginx", "-g", "daemon off;"]