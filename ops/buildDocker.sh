if [ ! "$(docker ps -a | grep keyserver)" ]; then
  docker rm -f keyserver || true
  # if you have rsa passphrase, use this line instead
  # docker run -d --restart unless-stopped -v ~/.ssh/id_rsa:/root/.ssh/id_rsa --name=keyserver mdsol/docker-ssh-exec -pwd [RSA_PASSPHRASE] -server || true
  docker run -d --restart unless-stopped -v ~/.ssh/id_rsa:/root/.ssh/id_rsa --name=keyserver mdsol/docker-ssh-exec -server || true
fi
docker build -t cpptrader:master .
