#!/bin/sh

# this is to initialize the couchdb
sleep 5s
curl -X PUT http://ludx:supersecret@couchdb:5984/_users
curl -X PUT http://ludx:supersecret@couchdb:5984/_replicator
curl -X PUT http://ludx:supersecret@couchdb:5984/_global_changes
curl -X PUT http://ludx:supersecret@couchdb:5984/cashier-particl

echo "NODE:"
node --version
echo "NPM:"
npm --version
echo "YARN:"
yarn --version
ls -al /app
yarn install --check-files
yarn serve:docker
