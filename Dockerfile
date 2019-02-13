FROM mhart/alpine-node:10.11.0

RUN apk add --update --no-cache gcc g++ make libc6-compat python git build-base openssl-dev curl bash
RUN npm install --global -s --no-progress wait-port yarn ts-node tslint typescript

RUN mkdir -p /app/data/database
WORKDIR /app/
COPY package.json /app
COPY yarn.lock /app

#RUN yarn install
#COPY . /app/
#RUN bin/ci-create-dbs.sh
#RUN bin/ci-create-build-version.sh
#VOLUME /app/data
#VOLUME /app/
#CMD [ "yarn", "serve" ]
#CMD [ "bin/entrypoint.sh" ]

#EXPOSE 3000 3100 3200
