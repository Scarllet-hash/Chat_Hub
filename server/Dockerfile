FROM gcc:latest
WORKDIR /app
COPY chat_server.c .
RUN gcc -o chat_server chat_server.c
CMD ["./chat_server"]