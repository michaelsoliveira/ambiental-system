cd $(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)/../

source .env

cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# node .next/standalone/server.js