FROM docker.io/library/alpine
RUN  apk add --update nodejs npm
WORKDIR /workspace/journal
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . . 
RUN npm run build
ENTRYPOINT [ "run.sh" ]