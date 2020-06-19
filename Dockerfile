FROM python:3.7.6-stretch

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git build-essential wget bash ca-certificates

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN wget https://github.com/mdsol/docker-ssh-exec/releases/download/v0.5.2/docker-ssh-exec_0.5.2_linux_amd64.tar.gz
RUN tar -xzf docker-ssh-exec_0.5.2_linux_amd64.tar.gz -C /bin && \
  cp /bin/docker-ssh-exec_0.5.2_linux_amd64/docker-ssh-exec /bin/docker-ssh-exec

RUN mkdir /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 12.14.1

# Install nvm with node and npm
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash

RUN source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN npm i npm@6.13.0 -g
RUN npm i pm2 -g
RUN npm i node-gyp -g

RUN mkdir -p /root/.ssh/
RUN chmod 0700 /root/.ssh

RUN ssh-keyscan github.com >/root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >/root/.ssh/known_hosts
RUN pip install numpy pandas datetime 

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/

# debug
RUN docker-ssh-exec ls -al /root/.ssh/
RUN docker-ssh-exec git clone git@bitbucket.org:whateverhow/simcontractex.git
RUN docker-ssh-exec git clone git@bitbucket.org:whateverhow/basic-backtest.git
RUN docker-ssh-exec npm ci

COPY tsconfig.json binding.gyp /app/

COPY src /app/src

RUN node-gyp rebuild && npm run tsc
# RUN ls /usr/local/lib
RUN ls -al /usr/local/lib/libpython3.7m.so.1.0
CMD node
