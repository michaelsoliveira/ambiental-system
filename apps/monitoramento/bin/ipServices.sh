#!/bin/bash

# https://stackoverflow.com/a/34749387

docker inspect -f '{{.Name}} - {{.ID}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $(docker ps -q)
