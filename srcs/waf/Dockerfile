FROM alpine:3.19 AS builder

RUN apk add --no-cache \
    gcc g++ make cmake git \
    automake autoconf libtool \
    linux-headers \
    pcre-dev \
    openssl-dev \
    libxml2-dev \
    curl-dev \
    yajl-dev \
    lmdb-dev \
    geoip-dev \
    libmaxminddb-dev \
    flex bison

# libmodsecurity
RUN git clone --depth 1 -b v3.0.12 \
    https://github.com/owasp-modsecurity/ModSecurity \
    /tmp/ModSecurity && \
    cd /tmp/ModSecurity && \
    git submodule update --init --recursive && \
    ./build.sh && \
    ./configure && \
    make -j$(nproc) && \
    make install

# nginx-connector
RUN git clone --depth 1 \
    https://github.com/owasp-modsecurity/ModSecurity-nginx \
    /tmp/ModSecurity-nginx

# compile Nginx with connector
RUN wget http://nginx.org/download/nginx-1.26.3.tar.gz && \
    tar -xzf nginx-1.26.3.tar.gz && \
    cd nginx-1.26.3 && \
    ./configure \
        --with-compat \
        --with-http_ssl_module \
        --with-http_v2_module \
        --add-dynamic-module=/tmp/ModSecurity-nginx && \
    make -j$(nproc) && \
    make install

FROM alpine:3.19

# Runtime dependencies
RUN apk add --no-cache \
    pcre \
    openssl \
    libxml2 \
    libcurl \
    yajl \
    lmdb \
    libmaxminddb \
    libstdc++ \
    geoip

# Copy Nginx + ModSecurity compiled
COPY --from=builder /usr/local/nginx /usr/local/nginx
COPY --from=builder /usr/local/modsecurity /usr/local/modsecurity

# OWASP CRS
RUN mkdir -p /var/log/nginx && \
    mkdir -p /etc/nginx/modsecurity.d && \
    wget -O /tmp/crs.tar.gz \
    https://github.com/coreruleset/coreruleset/archive/refs/tags/v4.7.0.tar.gz && \
    tar -xzf /tmp/crs.tar.gz -C /etc/nginx/modsecurity.d/ && \
    mv /etc/nginx/modsecurity.d/coreruleset-4.7.0 /etc/nginx/modsecurity.d/owasp-crs && \
    rm /tmp/crs.tar.gz

# RUN wget -O /tmp/crs.tar.gz \
#     https://github.com/coreruleset/coreruleset/archive/refs/tags/v4.7.0.tar.gz && \
#     tar -xzf /tmp/crs.tar.gz -C /etc/nginx/ && \
#     mv /etc/nginx/coreruleset-4.7.0 /etc/nginx/owasp-crs && \
#     rm /tmp/crs.tar.gz

# Copy configs
COPY nginx.conf /usr/local/nginx/conf/nginx.conf
COPY modsecurity.conf /etc/nginx/modsecurity.d/modsecurity.conf
COPY crs-setup.conf /etc/nginx/modsecurity.d/owasp-crs/crs-setup.conf
EXPOSE 80 443

CMD ["/usr/local/nginx/sbin/nginx", "-g", "daemon off;"]