FROM nginx:mainline-alpine

EXPOSE 443

RUN apk update && apk upgrade && \
    apk add --no-cache --update openssl && \
    rm -rf /var/cache/apk/* && \
    wget -O /usr/local/bin/mkcert 'https://dl.filippo.io/mkcert/latest?for=linux/amd64' && \
    chmod +x /usr/local/bin/mkcert && \
    mkdir -p /etc/nginx/certs && \
    cd /etc/nginx/certs && \
    mkcert --install && \
    mkdir -p /usr/share/nginx/rootCA/app.product-viewer.test && \
    cp `mkcert -CAROOT`/rootCA.pem /usr/share/nginx/rootCA/app.product-viewer.test/rootCA.pem && \
    mkcert --cert-file app.product-viewer.test.crt --key-file app.product-viewer.test.key \
      app.product-viewer.test *.app.product-viewer.test

COPY ./config/app.conf /etc/nginx/conf.d/app.conf