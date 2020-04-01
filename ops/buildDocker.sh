if [ ! "$(docker ps -a | grep keyserver)" ]; then
  docker rm -f keyserver || true
  docker run -d --restart unless-stopped -v ~/.ssh/id_rsa:/root/.ssh/id_rsa --name=keyserver \
  mdsol/docker-ssh-exec -server || true
fi
docker build -t cpptrader:master .
