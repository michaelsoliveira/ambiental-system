#!/bin/bash

source ./bin/confirma.sh

echo -e '\n'

yesno=""

confirm "Deseja instanciar a Aplicação Standalone?"

yesno=$?

if [ $yesno -eq 0 ]; then

    cd $(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/../

    # DOCKER_CONFIG=~/.docker DOCKER_BUILDKIT=0  env $(cat .env.io) docker compose up
    node .next/standalone/server.js
fi

echo -e '\n'
