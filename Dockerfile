FROM node:16
RUN apt-get update
RUN apt-get install -y chromium-bsu libatk-bridge2.0-0  libcups2 libxkbcommon-x11-0 libxdamage1 libgtk-3-0 libgbm-dev fonts-liberation libnspr4 libnss3 xdg-utils
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb

RUN mkdir /tmpapp
# Create app directory
WORKDIR /usr/src/app


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#RUN npm install npm@8.12.1 
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3333
CMD [ "npm", "start" ]