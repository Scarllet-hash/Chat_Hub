#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <fcntl.h>
#include <errno.h>

#define PORT 12345
#define MAX_CLIENTS 100
#define BUFFER_SIZE 1024
#define PSEUDO_SIZE 32

typedef struct {
    int sock;
    char pseudo[PSEUDO_SIZE];
} Client;

Client clients[MAX_CLIENTS];

void send_to_client(int sock, const char* msg) {
    send(sock, msg, strlen(msg), 0);
}

void send_to_all(const char* msg, int except_sock) {
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (clients[i].sock > 0 && clients[i].sock != except_sock) {
            send_to_client(clients[i].sock, msg);
        }
    }
}

void send_user_list(int sock) {
    char list[BUFFER_SIZE] = "USERS:";
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (clients[i].sock > 0) {
            strcat(list, " ");
            strcat(list, clients[i].pseudo);
        }
    }
    strcat(list, "\n");
    send_to_client(sock, list);
}

int find_client_by_pseudo(const char* pseudo) {
    for (int i = 0; i < MAX_CLIENTS; i++) {
        if (clients[i].sock > 0 && strcmp(clients[i].pseudo, pseudo) == 0) {
            return clients[i].sock;
        }
    }
    return -1;
}

int main() {
    int server_fd, new_socket, max_sd, sd, activity, i, valread;
    struct sockaddr_in address;
    char buffer[BUFFER_SIZE];

    fd_set readfds;
    for (i = 0; i < MAX_CLIENTS; i++) clients[i].sock = 0;

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, (char *)&opt, sizeof(opt));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }
    if (listen(server_fd, 10) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }
    printf("C Chat server (private+room) listening on port %d\n", PORT);

    while (1) {
        FD_ZERO(&readfds);
        FD_SET(server_fd, &readfds);
        max_sd = server_fd;
        for (i = 0; i < MAX_CLIENTS; i++) {
            sd = clients[i].sock;
            if (sd > 0) FD_SET(sd, &readfds);
            if (sd > max_sd) max_sd = sd;
        }
        activity = select(max_sd + 1, &readfds, NULL, NULL, NULL);
        if ((activity < 0) && (errno != EINTR)) perror("select error");

        // New connection
        if (FD_ISSET(server_fd, &readfds)) {
            int addrlen = sizeof(address);
            if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen)) < 0) {
                perror("accept");
                exit(EXIT_FAILURE);
            }
            for (i = 0; i < MAX_CLIENTS; i++) {
                if (clients[i].sock == 0) {
                    clients[i].sock = new_socket;
                    strcpy(clients[i].pseudo, ""); // will be set at registration
                    break;
                }
            }
        }

        // IO for each client
        for (i = 0; i < MAX_CLIENTS; i++) {
            sd = clients[i].sock;
            if (sd > 0 && FD_ISSET(sd, &readfds)) {
                if ((valread = read(sd, buffer, BUFFER_SIZE - 1)) == 0) {
                    // Disconnected
                    close(sd);
                    clients[i].sock = 0;
                    strcpy(clients[i].pseudo, "");
                } else {
                    buffer[valread] = '\0';
                    // Registration
                    if (strncmp(buffer, "/_register ", 11) == 0) {
                        strncpy(clients[i].pseudo, buffer + 11, PSEUDO_SIZE - 1);
                        clients[i].pseudo[strcspn(clients[i].pseudo, "\r\n")] = '\0';
                        send_user_list(sd);
                        send_to_all("USERLIST_CHANGED\n", 0);
                    }
                    // User list request
                    else if (strncmp(buffer, "/_list", 6) == 0) {
                        send_user_list(sd);
                    }
                    // Private message
                    else if (strncmp(buffer, "/_to ", 5) == 0) {
                        char *p = strchr(buffer + 5, ':');
                        if (p) {
                            *p = '\0';
                            char* to_pseudo = buffer + 5;
                            char* msg = p + 1;
                            int dest_sd = find_client_by_pseudo(to_pseudo);
                            if (dest_sd > 0) {
                                char privmsg[BUFFER_SIZE];
                                snprintf(privmsg, sizeof(privmsg), "(privé de %s):%s", clients[i].pseudo, msg);
                                send_to_client(dest_sd, privmsg);
                            } else {
                                send_to_client(sd, "Pseudo inconnu\n");
                            }
                        }
                    }
                    // Room/group chat message
                    else if (strncmp(buffer, "/room ", 6) == 0) {
                        char* msg = buffer + 6;
                        char roommsg[BUFFER_SIZE];
                        snprintf(roommsg, sizeof(roommsg), "(room de %s):%s", clients[i].pseudo, msg);
                        send_to_all(roommsg, sd); // broadcast to all except sender
                    }
                }
            }
        }
    }
    return 0;
}