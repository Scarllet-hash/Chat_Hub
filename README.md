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

- [Votre Nom ou GitHub](https://github.com/Scarllet-hash)

---

> **Astuce** : Vous pouvez ouvrir plusieurs onglets navigateur pour simuler plusieurs utilisateurs.
