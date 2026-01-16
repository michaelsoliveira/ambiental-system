#!/bin/bash

echo -e '\n'

cd $(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/../

# DOCKER_CONFIG=~/.docker env $(cat .env.io) docker compose down
env $(cat .env.io) docker compose down

echo -e '\n'
