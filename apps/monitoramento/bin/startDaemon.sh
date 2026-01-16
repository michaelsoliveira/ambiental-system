#!/bin/bash

source ./bin/confirma.sh

echo -e '\n'

yesno=""

confirm "Deseja iniciar daemon(serviço) forçando recriação(build)?"

yesno=$?

if [ $yesno -eq 0 ]; then

    cd $(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/../

    # DOCKER_CONFIG=~/.docker env $(cat .env.io) docker compose up  --build --force-recreate --remove-orphans --wait
    docker compose up --build --force-recreate --remove-orphans --wait

else

    cd $(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/../

    # DOCKER_CONFIG=~/.docker env $(cat .env.io) docker compose up --build --force-recreate --remove-orphans --wait
    docker compose up --wait
fi

echo -e '\n'
