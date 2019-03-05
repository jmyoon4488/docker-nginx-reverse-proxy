FROM node:carbon

ENV SRCDIR /src
RUN mkdir -p $SRCDIR/app && chown -R node:node $SRCDIR

WORKDIR $SRCDIR
COPY ./package.json $SRCDIR

RUN npm install

COPY . $SRCDIR

EXPOSE 3000
WORKDIR $SRCDIR/app

CMD ["node", "app.js"]