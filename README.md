# ChatHub

ChatHub est une application de chat en temps réel multi-utilisateurs, développée en React (frontend) et en C (serveur TCP).  
Elle permet :
- Discussion privée entre utilisateurs connectés
- Discussion de groupe via un salon ("Groupe")
- Notifications de nouveaux messages non lus
- Affichage des utilisateurs connectés ("Contacts online")

## Fonctionnalités principales

- **WebSocket** : Communication temps réel entre client et serveur
- **Chat privé** : Sélectionnez un utilisateur pour discuter en 1-1
- **Chat de groupe** : Salon « Groupe » pour discuter avec tous les connectés
- **Notifications** : Badge vert pour les messages non lus
- **Liste des utilisateurs en ligne** : Affichée sur la gauche

## Structure du projet

```
/
├── client/        # Frontend React
│   ├── src/App.js
│   ├── ...
│   └── Dockerfile
├── server/        # Serveur C (TCP)
│   ├── chat_server.c
│   └── Dockerfile
├── README.md
└── ...
```

## Démarrage rapide
Lancer le projet complet via la commande:
```sh
docker-compose up --build
```
Ou
### 1. Lancer le serveur C

```sh
cd server
gcc chat_server.c -o chat_server
./chat_server
```
Ou via Docker :
```sh
docker build -t chat_server .
docker run -p 12345:12345 chat_server
```

### 2. Lancer le client React

```sh
cd client
npm install
npm start
```
Ou via Docker :
```sh
docker build -t chat_client .
docker run -p 3000:3000 chat_client
```

### 3. Connexion

- Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.
- Entrez un pseudo pour rejoindre le chat.
- Cliquez sur "Groupe" pour le salon général ou sur un utilisateur pour une discussion privée.

## Protocole côté client

- Enregistrement pseudo : `/_register <pseudo>`
- Message privé : `/_to <pseudo>: <message>`
- Message de groupe : `/room <message>`
- Liste des utilisateurs : `/_list`

## Dépendances

- **Client** : React, WebSocket (natif)
- **Serveur** : C standard, POSIX sockets

## Personnalisation

- Les couleurs et styles sont dans `client/src/App.js`
- Ajoutez d'autres rooms, notifications, ou logs selon vos besoins

## Auteur

- [Scarllet-hash](https://github.com/Scarllet-hash)

---

> **Astuce** : Vous pouvez ouvrir plusieurs onglets navigateur pour simuler plusieurs utilisateurs.

# Schéma explicatif : WebSocketd comme pont WebSocket ↔ TCP

```plaintext
+-------------------+         WebSocket         +------------------+        TCP         +-------------------------+
|  Navigateur Web   | <----------------------> |   websocketd     | <--------------->  |  Serveur C (chat_server)|
| (React/JS client) |  ws://localhost:8080     | (avec socat)     | 127.0.0.1:12345    |   (TCP natif)           |
+-------------------+                          +------------------+                   +-------------------------+
```

**Détail du cheminement d'un message :**

1. **L'utilisateur envoie un message** depuis le navigateur via JavaScript (WebSocket sur ws://localhost:8080).
2. **websocketd** reçoit ce message et lance `/tcp-proxy.sh`, qui exécute :  
   `socat STDIO TCP:server:12345`
3. **socat** fait le pont entre les E/S WebSocket (gérées par websocketd) et une connexion TCP vers ton serveur C (`chat_server.c`).
4. Le serveur C traite le message, puis la réponse suit le même chemin en sens inverse.

---

## Illustration étape par étape

```plaintext
UTILISATEUR
    │
    ▼
Navigateur (React/JS) --WebSocket--> websocketd --STDIO--> socat --TCP--> Serveur C
    ▲                                                                         │
    └-------------------<----------------<----------------<-------------------┘
         (réponse)
```

---

## Pourquoi utiliser websocketd + socat ?

- **websocketd** : Traduit les messages WebSocket en entrée/sortie standard (STDIN/STDOUT).
- **socat** : Connecte STDIN/STDOUT à une socket TCP.
- **Le serveur C** n'a pas besoin de comprendre le protocole WebSocket, uniquement TCP.

---

## Résumé

- **websocketd** permet à des clients WebSocket modernes (navigateurs, etc.) de dialoguer avec des serveurs qui n’implémentent pas WebSocket, mais seulement TCP ou du texte.
- **socat** relie ce flux texte à une connexion TCP.

---

> **Astuce** : Tu peux remplacer le serveur C par n’importe quel programme console : websocketd s’occupe de la passerelle WebSocket pour toi.
