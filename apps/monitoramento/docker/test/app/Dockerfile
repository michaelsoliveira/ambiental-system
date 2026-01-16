# Dockerfile

# Use node alpine as it's a small node image
FROM node:18-alpine

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

# release stage
FROM nginx:stable-alpine as release-stage

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/

COPY --from=build-stage /app/build /usr/share/nginx/html

EXPOSE 80

ENV PATH /app/node_modules/.bin:$PATH

CMD [ "nginx", "-g", "daemon off;" ]
