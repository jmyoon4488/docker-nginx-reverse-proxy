# Nginx Reverse Proxy

* Use docker-compose
1. nginx-proxy container start
1. Build Node.js image by Dockerfile
1. Start Node.js container
1. check https proxy
-----
1. nginx-proxy container start by docker-compose
    * change volumes path (/your/path/nginx-proxy)
    * proxy/nginx-proxy-letsencrypt.yml
    ```yml
    version: '3'

    services:
      nginx-proxy:
        container_name: nginx-proxy
        image: jwilder/nginx-proxy
        ports:
          - 80:80
          - 443:443
        restart: always
        volumes:
          - /your/path/nginx-proxy/log:/var/log/nginx
          - /your/path/nginx-proxy/html:/usr/share/nginx/html
          - /your/path/nginx-proxy/certs:/etc/nginx/certs
          - /your/path/nginx-proxy/vhost.d:/etc/nginx/vhost.d
          - /your/path/nginx-proxy/config:/etc/nginx/conf.d
          - /var/run/docker.sock:/tmp/docker.sock:ro
        labels:
          - com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy

      etsencrypt-nginx-proxy:
        container_name: leten-nginx-proxy
        image: jrcs/letsencrypt-nginx-proxy-companion
        restart: always
        depends_on:
          - nginx-proxy
        volumes:
          - /your/path/nginx-proxy/certs:/etc/nginx/certs
          - /your/path/nginx-proxy/vhost.d:/etc/nginx/vhost.d
          - /your/path/nginx-proxy/html:/usr/share/nginx/html
          - /var/run/docker.sock:/var/run/docker.sock:ro

    networks:
      default:
        external:
          name: nginx-proxy
    ```

    ```
    $ docker-compose -f nginx-proxy-letsencrypt.yml up -d
    ```

    * check docker container ($ docker ps)
    
1. Build Node.js image by Dockerfile
    * node/Dockerfile
    ```dockerfile
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
    ```
    * package.json
    ```json
    {
        "name": "node",
        "version": "0.0.0",
        "private": true,
        "scripts": {
            "start": "node ./app/app.js"
        },
        "dependencies": {
            "debug": "~2.6.9",
            "ejs": "~2.5.7",
            "express": "~4.16.0",
            "request": "^2.88.0",
            "uuid": "^2.0.2"
        }
    }
    ```

    * build image
    ```
    $ docker build --tag nodejs:test .
    ```

    * check docker image
    ```
    REPOSITORY                               TAG                 IMAGE ID            CREATED             SIZE
    nodejs                                   test                000000000000        24 minutes ago      902 MB
    ```

1. Start Node.js container
    * change VIRTUAL_HOST, VIRTUAL_PORT, LETSENCRYPT_HOST, LETSCRYPT_EMAIL
    * If you want to change port, you must modify and rebuild docker image from Dockerfile
    * node/node-test.yml
    ```yml
    version: '3'

    services:
      nodejs-test:
        container_name: node-test
        image: nodejs:test
        volumes:
          - ./app:/src/app
        environment:
          - VIRTUAL_HOST=sub.domain.com
          - VIRTUAL_PORT=3000
          - LETSENCRYPT_HOST=sub.domain.com
          - LETSCRYPT_EMAIL=your@email.com

    networks:
      default:
        external:
          name: nginx-proxy
    ```
    * check container
    ```
    $ docker ps
    ```

1. check https proxy
    * connect your sub.domain url from browser
    * check nginx config file
    ```
    $ docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf
    ```
    or
    ```
    $ sudo cat ./config/default.conf
    ```

    * default.conf
    ```nginx
    ~~~~~~~
    # sub.domain.com
    upstream sub.domain.com {
                    ## Can be connected with "nginx-proxy" network
                # node-test
                server 172.5.0.1:3000;
    }
    server {
        server_name sub.domain.com;
        listen 80 ;
        access_log /var/log/nginx/access.log vhost;
        return 301 https://$host$request_uri;
    }
    server {
        server_name sub.domain.com;
        listen 443 ssl http2 ;
        access_log /var/log/nginx/access.log vhost;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        ssl_ciphers 'CODE~~~~~~~~~~~~~';
        ssl_prefer_server_ciphers on;
        ~~~ many options 
        include /etc/nginx/vhost.d/default;
        location / {
            proxy_pass http://sub.domain.com;
        }
    }
    ```