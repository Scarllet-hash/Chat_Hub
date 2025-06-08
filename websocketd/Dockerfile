FROM debian:stable-slim

RUN apt-get update && apt-get install -y socat curl unzip ca-certificates && rm -rf /var/lib/apt/lists/*

RUN curl -Lo /tmp/websocketd.zip https://github.com/joewalnes/websocketd/releases/download/v0.4.1/websocketd-0.4.1-linux_amd64.zip && \
    unzip /tmp/websocketd.zip -d /tmp && \
    mv /tmp/websocketd /usr/local/bin/websocketd && \
    chmod +x /usr/local/bin/websocketd && \
    rm /tmp/websocketd.zip

COPY tcp-proxy.sh /tcp-proxy.sh
RUN chmod +x /tcp-proxy.sh

CMD ["/usr/local/bin/websocketd", "--port=8080", "/tcp-proxy.sh"]