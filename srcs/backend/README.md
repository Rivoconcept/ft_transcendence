# Backend API Documentation

## Table des matières

1. [Architecture](#architecture)
2. [Entités de la base de données](#entités-de-la-base-de-données)
3. [Relations entre entités](#relations-entre-entités)
4. [Services](#services)
5. [Routes API](#routes-api)
6. [WebSocket](#websocket)
7. [Authentification](#authentification)

---

## Architecture

```
src/
├── database/
│   ├── data-source.ts       # Configuration TypeORM
│   └── entities/            # Entités de la base de données
├── controllers/             # Contrôleurs HTTP
├── services/                # Logique métier
├── routes/                  # Définition des routes
├── middlewares/             # Middlewares (auth, etc.)
├── websocket.ts             # Gestion WebSocket (Socket.IO)
├── app.ts                   # Configuration Express
└── index.ts                 # Point d'entrée
```

---

## Entités de la base de données

### User

Représente un utilisateur de l'application.

| Champ       | Type    | Description                       |
|-------------|---------|-----------------------------------|
| id          | int     | Identifiant unique (PK)           |
| username    | string  | Nom d'utilisateur (unique)        |
| realname    | string  | Nom réel                          |
| avatar      | string  | URL de l'avatar                   |
| password    | string  | Mot de passe hashé (bcrypt)       |
| is_online   | boolean | Statut de connexion               |

---

### Invitation

Gère les demandes d'amitié entre utilisateurs.

| Champ       | Type             | Description                      |
|-------------|------------------|----------------------------------|
| id          | int              | Identifiant unique (PK)          |
| sender_id   | int              | ID de l'expéditeur (FK → User)   |
| receiver_id | int              | ID du destinataire (FK → User)   |
| status      | enum             | `pending` ou `accepted`          |
| created_at  | timestamp        | Date de création                 |

**Comportement:**
- Une invitation refusée est **supprimée** (pas de statut "declined")
- Une invitation acceptée devient une relation d'amitié (`status = accepted`)

---

### Chat

Représente une conversation (directe ou groupe).

| Champ      | Type   | Description                              |
|------------|--------|------------------------------------------|
| id         | int    | Identifiant unique (PK)                  |
| name       | string | Nom du groupe (null pour chat direct)    |
| channel_id | string | ID unique pour WebSocket (16 chars hex)  |
| type       | enum   | `direct` ou `group`                      |
| created_at | timestamp | Date de création                      |

---

### ChatMember

Table de liaison entre User et Chat.

| Champ   | Type | Description                   |
|---------|------|-------------------------------|
| id      | int  | Identifiant unique (PK)       |
| user_id | int  | ID de l'utilisateur (FK)      |
| chat_id | int  | ID du chat (FK)               |

---

### Message

Message dans une conversation.

| Champ      | Type      | Description                          |
|------------|-----------|--------------------------------------|
| id         | int       | Identifiant unique (PK)              |
| type       | enum      | `text` ou `image`                    |
| content    | text      | Contenu du message                   |
| author_id  | int       | ID de l'auteur (FK → User)           |
| chat_id    | int       | ID du chat (FK → Chat)               |
| created_at | timestamp | Date de création                     |
| updated_at | timestamp | Date de modification                 |

---

### Reaction

Définit les réactions disponibles (emojis).

| Champ | Type   | Description                |
|-------|--------|----------------------------|
| id    | int    | Identifiant unique (PK)    |
| code  | string | Emoji (ex: 👍, ❤️)         |

---

### UserReaction

Table de liaison pour les réactions sur les messages.

| Champ       | Type | Description                    |
|-------------|------|--------------------------------|
| id          | int  | Identifiant unique (PK)        |
| user_id     | int  | ID de l'utilisateur (FK)       |
| message_id  | int  | ID du message (FK)             |
| reaction_id | int  | ID de la réaction (FK)         |

**Contrainte:** UNIQUE(user_id, message_id, reaction_id) - Un utilisateur ne peut mettre qu'une fois la même réaction sur un message.

---

### Game

Définit les types de jeux disponibles.

| Champ | Type   | Description             |
|-------|--------|-------------------------|
| id    | int    | Identifiant unique (PK) |
| name  | string | Nom du jeu              |

---

### Match

Représente une partie de jeu.

| Champ       | Type      | Description                              |
|-------------|-----------|------------------------------------------|
| id          | char(4)   | Code unique (ex: "AB12") (PK)            |
| set         | int       | Nombre total de sets                     |
| current_set | int       | Set en cours                             |
| author_id   | int       | Créateur du match (FK → User)            |
| game_id     | int       | Type de jeu (FK → Game, nullable)        |
| is_open     | boolean   | Match ouvert aux nouveaux joueurs        |
| is_private  | boolean   | Match privé (non visible dans discover)  |
| match_over  | boolean   | Match terminé                            |
| created_at  | timestamp | Date de création                         |

---

### Participation

Table de liaison entre User et Match avec score.

| Champ    | Type    | Description                   |
|----------|---------|-------------------------------|
| id       | int     | Identifiant unique (PK)       |
| user_id  | int     | ID du participant (FK)        |
| match_id | char(4) | ID du match (FK)              |
| score    | int     | Score du participant          |

---

## Relations entre entités

### User
- Peut envoyer plusieurs **Invitation** (sender_id)
- Peut recevoir plusieurs **Invitation** (receiver_id)
- Peut créer plusieurs **Match** (author_id)
- Peut participer à plusieurs **Match** via **Participation**
- Peut être membre de plusieurs **Chat** via **ChatMember**
- Peut envoyer plusieurs **Message**
- Peut ajouter plusieurs **UserReaction** sur des messages

### Invitation
- Lie deux **User** (sender et receiver)
- Quand `status = accepted`, représente une relation d'amitié

### Chat
- Contient plusieurs **User** via **ChatMember**
- Contient plusieurs **Message**
- Type `direct` : exactement 2 membres
- Type `group` : 2+ membres, possède un nom

### Message
- Appartient à un **Chat**
- A un auteur (**User**)
- Peut avoir plusieurs **UserReaction**

### UserReaction
- Lie un **User**, un **Message** et une **Reaction**
- Système de toggle : ajouter la même réaction la retire

### Match
- Créé par un **User** (author)
- Peut être associé à un **Game**
- A plusieurs participants via **Participation**

### Participation
- Lie un **User** à un **Match**
- Stocke le score du participant

---

## Services

### AuthService

Gestion de l'authentification JWT.

#### `register(data: RegisterDTO)`
Crée un nouveau compte utilisateur.
- Vérifie que le username n'existe pas déjà
- Hash le mot de passe avec bcrypt (10 rounds)
- Crée l'utilisateur en base avec `is_online = false`
- Génère une paire de tokens JWT (access + refresh)
- **Retourne:** L'utilisateur (sans mot de passe) et les tokens
- **Erreur:** "Username already exists" si le username est pris

#### `login(data: LoginDTO)`
Authentifie un utilisateur existant.
- Recherche l'utilisateur par username
- Compare le mot de passe avec bcrypt
- Génère une nouvelle paire de tokens JWT
- **Retourne:** L'utilisateur (sans mot de passe) et les tokens
- **Erreur:** "Invalid credentials" si username/password incorrect

#### `refresh(refreshToken: string)`
Rafraîchit une paire de tokens expirée.
- Vérifie et décode le refresh token
- Recherche l'utilisateur en base pour confirmer qu'il existe toujours
- Génère une nouvelle paire de tokens
- **Retourne:** Nouvelle paire de tokens (access + refresh)
- **Erreur:** Si le token est invalide ou l'utilisateur n'existe plus

#### `verifyToken(token: string)`
Vérifie un access token JWT.
- Décode et valide le token avec le secret JWT
- **Retourne:** Le payload `{ userId, username }`
- **Erreur:** Si le token est invalide ou expiré

#### `verifyRefreshToken(token: string)`
Vérifie un refresh token JWT.
- Décode et valide le token avec le secret refresh
- **Retourne:** Le payload `{ userId, username }`
- **Erreur:** Si le token est invalide ou expiré

---

### UserService

Gestion des utilisateurs.

#### `getById(userId: number)`
Récupère un utilisateur par son ID.
- Recherche en base par ID
- Exclut le mot de passe de la réponse
- **Retourne:** L'utilisateur sans mot de passe, ou `null` si non trouvé

#### `getByUsername(username: string)`
Récupère un utilisateur par son username.
- Recherche en base par username
- Exclut le mot de passe de la réponse
- **Retourne:** L'utilisateur sans mot de passe, ou `null` si non trouvé

#### `updateProfile(userId: number, data: { realname?, avatar? })`
Met à jour le profil d'un utilisateur.
- Met à jour uniquement les champs fournis (realname et/ou avatar)
- **Retourne:** L'utilisateur mis à jour

#### `setOnlineStatus(userId: number, isOnline: boolean)`
Change le statut en ligne d'un utilisateur.
- Met à jour `is_online` en base
- Récupère la liste des amis de l'utilisateur
- Émet un événement WebSocket `friend:status` à chaque ami pour les notifier du changement
- **Retourne:** void

#### `getFriends(userId: number)`
Récupère la liste complète des amis d'un utilisateur.
- Recherche toutes les invitations avec `status = accepted` où l'utilisateur est sender ou receiver
- Charge les relations sender/receiver
- Extrait l'ami (l'autre personne dans l'invitation)
- **Retourne:** Tableau d'objets User (sans mot de passe)

---

### InvitationService

Gestion des invitations d'amitié.

#### `sendInvitation(senderId: number, receiverUsername: string)`
Envoie une demande d'ami à un utilisateur.
- Recherche le destinataire par username
- Vérifie que l'utilisateur ne s'envoie pas une invitation à lui-même
- Vérifie qu'aucune invitation n'existe déjà entre ces deux utilisateurs (dans les deux sens)
- Crée l'invitation avec `status = pending`
- Émet un événement WebSocket `invitation:received` au destinataire
- **Retourne:** L'invitation créée
- **Erreurs:** "User not found", "Cannot send invitation to yourself", "You are already friends", "Invitation already pending"

#### `acceptInvitation(invitationId: number, userId: number)`
Accepte une invitation d'ami reçue.
- Recherche l'invitation où `receiver_id = userId` et `status = pending`
- Change le statut à `accepted`
- Émet un événement WebSocket `invitation:accepted` à l'expéditeur
- **Retourne:** L'invitation mise à jour
- **Erreur:** "Invitation not found" si l'invitation n'existe pas ou n'est pas destinée à cet utilisateur

#### `declineInvitation(invitationId: number, userId: number)`
Refuse une invitation d'ami reçue.
- Recherche l'invitation où `receiver_id = userId` et `status = pending`
- **Supprime** l'invitation de la base (pas de statut "declined")
- Émet un événement WebSocket `invitation:declined` à l'expéditeur
- **Retourne:** void
- **Erreur:** "Invitation not found"

#### `cancelInvitation(invitationId: number, userId: number)`
Annule une invitation (par l'expéditeur ou le destinataire).
- Recherche l'invitation où l'utilisateur est sender OU receiver et `status = pending`
- Supprime l'invitation de la base
- Émet un événement WebSocket `invitation:cancelled` à l'autre utilisateur
- **Retourne:** void
- **Erreur:** "Invitation not found"

#### `getPendingInvitations(userId: number)`
Récupère les invitations reçues en attente.
- Recherche les invitations où `receiver_id = userId` et `status = pending`
- Charge la relation `sender` pour avoir les infos de l'expéditeur
- **Retourne:** Tableau d'invitations avec sender chargé

#### `getSentInvitations(userId: number)`
Récupère les invitations envoyées en attente.
- Recherche les invitations où `sender_id = userId` et `status = pending`
- Charge la relation `receiver` pour avoir les infos du destinataire
- **Retourne:** Tableau d'invitations avec receiver chargé

#### `getFriendIds(userId: number)`
Récupère uniquement les IDs des amis (format normalisé).
- Recherche les invitations avec `status = accepted` où l'utilisateur est sender ou receiver
- Extrait l'ID de l'autre personne
- **Retourne:** Tableau d'IDs `[1, 2, 3]`

#### `getNonFriendIds(userId: number, page: number, limit: number, search?: string)`
Récupère les utilisateurs qui ne sont pas amis avec pagination et recherche.
- Récupère toutes les relations existantes (pending ou accepted)
- Construit un Set d'IDs à exclure (l'utilisateur lui-même + tous ses contacts)
- Recherche les utilisateurs dont l'ID n'est pas dans ce Set
- Si `search` est fourni, filtre par username ou realname (ILIKE)
- Applique la pagination (offset/limit)
- **Retourne:** `{ userIds: number[], total: number, hasMore: boolean }`

---

### ChatService

Gestion des conversations et messages.

#### `createDirectChat(currentUserId: number, data: { userId: number })`
Crée une conversation directe entre deux utilisateurs.
- Vérifie que l'utilisateur ne crée pas un chat avec lui-même
- Vérifie que l'autre utilisateur existe
- Vérifie si un chat direct existe déjà entre ces deux utilisateurs (le retourne si oui)
- Crée le chat avec `type = direct` et un `channel_id` unique (16 chars hex)
- Ajoute les deux utilisateurs comme membres (ChatMember)
- Fait rejoindre les deux utilisateurs à la room WebSocket `chat.{channel_id}`
- Émet `chat:created` aux deux utilisateurs
- **Retourne:** Le chat créé
- **Erreurs:** "Cannot create a chat with yourself", "User not found"

#### `createGroupChat(currentUserId: number, data: { name: string, memberIds: number[] })`
Crée un chat de groupe.
- Vérifie que le nom est fourni et non vide
- Vérifie qu'au moins un membre est fourni
- Vérifie que tous les utilisateurs (membres + créateur) existent
- Crée le chat avec `type = group`, le nom et un `channel_id` unique
- Ajoute tous les membres (créateur inclus, dédupliqué)
- Fait rejoindre tous les membres à la room WebSocket
- Émet `chat:created` à tous les membres
- **Retourne:** Le chat créé
- **Erreurs:** "Group name is required", "At least one member is required", "One or more users not found"

#### `leaveGroupChat(userId: number, chatId: number)`
Quitte un chat de groupe.
- Vérifie que le chat existe et est de type `group`
- Vérifie que l'utilisateur est membre du chat
- Supprime l'entrée ChatMember
- Fait quitter la room WebSocket à l'utilisateur
- Émet `chat:member-left` aux membres restants
- **Retourne:** void
- **Erreurs:** "Chat not found", "Cannot leave a direct chat", "You are not a member of this chat"

#### `getUserChats(userId: number)`
Récupère la liste des chats de l'utilisateur (format normalisé).
- Récupère tous les ChatMember de l'utilisateur
- Pour chaque chat, récupère les IDs des membres
- Pour chaque chat, récupère l'ID du dernier message (par date de création)
- Trie par date du dernier message (plus récent en premier)
- **Retourne:** Tableau de `{ id, name, type, channel_id, created_at, lastMessageId, memberIds }`

#### `getChatById(userId: number, chatId: number)`
Récupère les détails d'un chat spécifique.
- Vérifie que l'utilisateur est membre du chat
- Récupère le chat, ses membres (IDs) et l'ID du dernier message
- **Retourne:** Chat au format normalisé, ou `null` si non membre

#### `getChatMessages(userId: number, chatId: number, page: number, limit: number)`
Récupère les messages d'un chat avec pagination.
- Vérifie que l'utilisateur est membre du chat
- Récupère le total de messages pour la pagination
- Récupère les messages avec offset/limit, triés par date DESC
- Pour chaque message, récupère les réactions groupées par reactionId avec les userIds
- Inverse l'ordre pour avoir les messages en ordre chronologique
- **Retourne:** `{ messages: MessageItem[], total, page, limit, hasMore }`
- **Erreur:** "You are not a member of this chat"

#### `sendMessage(userId: number, data: { chatId: number, content: string, type?: string })`
Envoie un message dans un chat.
- Vérifie que le contenu n'est pas vide
- Vérifie que l'utilisateur est membre du chat
- Crée le message avec le type (text par défaut ou image)
- Émet `message:new` à tous les membres du chat via la room WebSocket
- **Retourne:** Le message créé au format normalisé
- **Erreurs:** "Message content is required", "You are not a member of this chat", "Chat not found"

#### `getMessageById(userId: number, messageId: number)`
Récupère un message spécifique avec ses réactions.
- Vérifie que le message existe
- Vérifie que l'utilisateur est membre du chat contenant le message
- Récupère les réactions groupées par reactionId
- **Retourne:** Message au format normalisé, ou `null` si non accessible

#### `toggleReaction(userId: number, messageId: number, reactionId: number)`
Ajoute ou retire une réaction sur un message (toggle).
- Vérifie que le message existe
- Vérifie que l'utilisateur est membre du chat
- Vérifie que la réaction existe en base
- Si la réaction existe déjà pour cet utilisateur → la supprime et émet `reaction:removed`
- Sinon → la crée et émet `reaction:added`
- **Retourne:** `{ added: true }` ou `{ added: false }`
- **Erreurs:** "Message not found", "You are not a member of this chat", "Reaction not found"

#### `getReactions()`
Récupère la liste des réactions disponibles.
- Récupère toutes les entrées de la table Reaction
- **Retourne:** Tableau de `{ id, code }`

---

### MatchService

Gestion des parties de jeu.

#### `createMatch(userId: number, data?: { is_private?, set?, game_id? })`
Crée un nouveau match.
- Génère un ID unique de 4 caractères (A-Z, 0-9), avec retry si collision
- Crée le match avec les options fournies (défauts: `is_private=false`, `set=1`, `is_open=true`)
- Ajoute le créateur comme premier participant avec `score=0`
- Fait rejoindre le créateur à la room WebSocket `match.{id}`
- Émet `match:created` au créateur
- **Retourne:** Match au format normalisé avec participantIds
- **Erreur:** "Failed to generate unique match ID" après 10 tentatives

#### `discoverMatches(gameId?: number)`
Récupère les matchs publics ouverts pour rejoindre.
- Filtre: `is_open=true`, `is_private=false`, `match_over=false`
- Filtre optionnel par `game_id` si fourni
- Récupère les participants de chaque match
- Trie par date de création DESC
- **Retourne:** Tableau de matchs au format normalisé

#### `getMatchById(matchId: string)`
Récupère les détails d'un match.
- Recherche le match par son ID (4 caractères)
- Récupère tous les participants
- **Retourne:** Match au format normalisé, ou `null` si non trouvé

#### `joinMatch(userId: number, matchId: string)`
Rejoint un match existant.
- Vérifie que le match existe
- Vérifie que le match n'est pas terminé (`match_over=false`)
- Vérifie que le match est ouvert (`is_open=true`)
- Vérifie que l'utilisateur n'est pas déjà participant
- Crée une participation avec `score=0`
- Fait rejoindre l'utilisateur à la room WebSocket
- Émet `match:player-joined` à tous les participants
- **Retourne:** Match au format normalisé
- **Erreurs:** "Match not found", "Match is already over", "Match is not open for joining", "You are already in this match"

#### `startMatch(userId: number, matchId: string)`
Démarre un match (créateur uniquement).
- Vérifie que le match existe et que l'utilisateur est le créateur
- Vérifie que le match n'est pas terminé et est encore ouvert
- Vérifie qu'il y a au moins 2 participants
- Passe `is_open=false` pour fermer le match aux nouveaux joueurs
- Émet `match:started` à tous les participants
- **Retourne:** Match au format normalisé
- **Erreurs:** "Match not found", "Only the match creator can start the match", "Match is already over", "Match has already started", "Need at least 2 players to start the match"

#### `nextSet(userId: number, matchId: string)`
Passe au set suivant (créateur uniquement).
- Vérifie que le match existe et que l'utilisateur est le créateur
- Vérifie que le match n'est pas terminé
- Incrémente `current_set`
- Si `current_set > set`, termine le match (`match_over=true`, `is_open=false`)
- Émet `match:ended` si terminé, sinon `match:set-updated`
- Si terminé, fait quitter la room à tous les participants
- **Retourne:** Match au format normalisé
- **Erreurs:** "Match not found", "Only the match creator can update the set", "Match is already over"

#### `setVisibility(userId: number, matchId: string, is_private: boolean)`
Change la visibilité d'un match (créateur uniquement).
- Vérifie que le match existe et que l'utilisateur est le créateur
- Vérifie que le match n'est pas terminé
- Met à jour `is_private`
- Émet `match:visibility-changed` aux participants
- **Retourne:** Match au format normalisé
- **Erreurs:** "Match not found", "Only the match creator can change visibility", "Cannot change visibility of a finished match"

#### `endMatch(userId: number, matchId: string)`
Termine un match manuellement (créateur uniquement).
- Vérifie que le match existe et que l'utilisateur est le créateur
- Vérifie que le match n'est pas déjà terminé
- Passe `match_over=true` et `is_open=false`
- Émet `match:ended` aux participants
- Fait quitter la room WebSocket à tous les participants
- **Retourne:** Match au format normalisé
- **Erreurs:** "Match not found", "Only the match creator can end the match", "Match is already over"

#### `updateScore(userId: number, matchId: string, action: "increment"|"decrement", amount: number)`
Met à jour le score d'un participant.
- Vérifie que le match existe et n'est pas terminé
- Vérifie que l'utilisateur est participant du match
- Incrémente ou décrémente le score (minimum 0)
- Émet `match:score-updated` avec oldScore, newScore, action et amount
- **Retourne:** `{ oldScore, newScore, participantId }`
- **Erreurs:** "Match not found", "Match is already over", "You are not a participant in this match"

---

## Routes API

Base URL: `/api`

### Authentication (`/api/auth`)

| Méthode | Route      | Auth | Description                    | Body                                        |
|---------|------------|------|--------------------------------|---------------------------------------------|
| POST    | /register  | Non  | Créer un compte                | `{ username, realname, password, avatar? }` |
| POST    | /login     | Non  | Se connecter                   | `{ username, password }`                    |
| POST    | /refresh   | Non  | Rafraîchir les tokens          | `{ refreshToken }`                          |

**Réponse register/login:**
```json
{
  "user": { "id": 1, "username": "john", "realname": "John Doe", "avatar": "", "is_online": false },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

---

### Users (`/api/users`)

| Méthode | Route   | Auth | Description                  | Body                        |
|---------|---------|------|------------------------------|-----------------------------|
| GET     | /me     | Oui  | Mon profil                   | -                           |
| PUT     | /me     | Oui  | Modifier mon profil          | `{ realname?, avatar? }`    |
| GET     | /:id    | Oui  | Profil d'un utilisateur      | -                           |

---

### Invitations (`/api/invitations`)

| Méthode | Route         | Auth | Description                          | Body/Query                          |
|---------|---------------|------|--------------------------------------|-------------------------------------|
| POST    | /             | Oui  | Envoyer une demande d'ami            | `{ username }`                      |
| GET     | /pending      | Oui  | Invitations reçues en attente        | -                                   |
| GET     | /sent         | Oui  | Invitations envoyées en attente      | -                                   |
| GET     | /friends      | Oui  | Liste des IDs d'amis                 | -                                   |
| GET     | /non-friends  | Oui  | Utilisateurs non-amis (paginé)       | `?page=1&limit=20&search=john`      |
| POST    | /:id/accept   | Oui  | Accepter une invitation              | -                                   |
| POST    | /:id/cancel   | Oui  | Annuler/Refuser une invitation       | -                                   |

**Réponse /friends:** `[1, 2, 3]` (tableau d'IDs)

**Réponse /non-friends:**
```json
{
  "userIds": [4, 5, 6],
  "total": 50,
  "hasMore": true
}
```

---

### Chats (`/api/chats`)

| Méthode | Route                          | Auth | Description                    | Body/Query                          |
|---------|--------------------------------|------|--------------------------------|-------------------------------------|
| GET     | /reactions                     | Oui  | Réactions disponibles          | -                                   |
| POST    | /direct                        | Oui  | Créer un chat direct           | `{ userId }`                        |
| POST    | /group                         | Oui  | Créer un groupe                | `{ name, memberIds[] }`             |
| GET     | /                              | Oui  | Mes chats                      | -                                   |
| GET     | /:id                           | Oui  | Détails d'un chat              | -                                   |
| GET     | /:id/messages                  | Oui  | Messages (paginés)             | `?page=1&limit=50`                  |
| POST    | /:id/messages                  | Oui  | Envoyer un message             | `{ content, type? }`                |
| GET     | /messages/:messageId           | Oui  | Détails d'un message           | -                                   |
| POST    | /messages/:messageId/reactions | Oui  | Toggle réaction                | `{ reactionId }`                    |
| POST    | /:id/leave                     | Oui  | Quitter un groupe              | -                                   |

**Réponse Chat:**
```json
{
  "id": 1,
  "name": null,
  "type": "direct",
  "channel_id": "a1b2c3d4e5f6g7h8",
  "created_at": "2024-01-01T00:00:00Z",
  "lastMessageId": 42,
  "memberIds": [1, 2]
}
```

**Réponse Message:**
```json
{
  "id": 42,
  "content": "Hello!",
  "type": "text",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "authorId": 1,
  "chatId": 1,
  "reactions": [
    { "reactionId": 1, "userIds": [1, 2] }
  ]
}
```

---

### Matches (`/api/matches`)

| Méthode | Route           | Auth | Description                        | Body/Query                              |
|---------|-----------------|------|------------------------------------|-----------------------------------------|
| POST    | /               | Oui  | Créer un match                     | `{ is_private?, set?, game_id? }`       |
| GET     | /discover       | Oui  | Matchs publics ouverts             | `?game_id=1`                            |
| GET     | /:id            | Oui  | Détails d'un match                 | -                                       |
| POST    | /:id/join       | Oui  | Rejoindre un match                 | -                                       |
| POST    | /:id/start      | Oui  | Démarrer (créateur)                | -                                       |
| POST    | /:id/next-set   | Oui  | Set suivant (créateur)             | -                                       |
| PATCH   | /:id/visibility | Oui  | Changer visibilité (créateur)      | `{ is_private }`                        |
| POST    | /:id/end        | Oui  | Terminer (créateur)                | -                                       |
| PATCH   | /:id/score      | Oui  | Modifier score (participant)       | `{ action: "increment"/"decrement", amount? }` |

**Réponse Match:**
```json
{
  "id": "AB12",
  "set": 3,
  "current_set": 1,
  "authorId": 1,
  "gameId": null,
  "is_open": true,
  "is_private": false,
  "match_over": false,
  "created_at": "2024-01-01T00:00:00Z",
  "participantIds": [1, 2]
}
```

---

## WebSocket

### Connexion

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  withCredentials: true,
});

// Authentification après connexion
socket.emit("auth", accessToken);

// Réponses
socket.on("auth:success", ({ userId, username }) => { ... });
socket.on("auth:error", ({ error }) => { ... });
```

### Rooms

- `user.{userId}` - Room personnelle de l'utilisateur
- `chat.{channelId}` - Room d'une conversation
- `match.{matchId}` - Room d'un match

### Événements Client → Serveur

| Événement    | Payload          | Description                    |
|--------------|------------------|--------------------------------|
| `auth`       | `token`          | S'authentifier avec JWT        |
| `chat:join`  | `channelId`      | Rejoindre une room de chat     |
| `chat:leave` | `channelId`      | Quitter une room de chat       |

### Événements Serveur → Client

#### Authentification

| Événement       | Payload                      | Description               |
|-----------------|------------------------------|---------------------------|
| `auth:success`  | `{ userId, username }`       | Authentification réussie  |
| `auth:error`    | `{ error }`                  | Erreur d'authentification |

#### Invitations

| Événement             | Payload                        | Description                    |
|-----------------------|--------------------------------|--------------------------------|
| `invitation:received` | `{ invitationId, senderId }`   | Nouvelle demande d'ami         |
| `invitation:accepted` | `{ invitationId, friendId }`   | Invitation acceptée            |
| `invitation:declined` | `{ invitationId }`             | Invitation refusée             |
| `invitation:cancelled`| `{ invitationId }`             | Invitation annulée             |

#### Utilisateurs

| Événement        | Payload                  | Description                   |
|------------------|--------------------------|-------------------------------|
| `friend:status`  | `{ userId, isOnline }`   | Changement de statut d'un ami |

#### Chats

| Événement           | Payload                                          | Description              |
|---------------------|--------------------------------------------------|--------------------------|
| `chat:created`      | `{ chatId, channelId, type, name? }`             | Nouveau chat créé        |
| `chat:member-left`  | `{ chatId, channelId, userId }`                  | Membre a quitté          |
| `message:new`       | `{ chatId, channelId, message }`                 | Nouveau message          |
| `reaction:added`    | `{ messageId, reactionId, userId }`              | Réaction ajoutée         |
| `reaction:removed`  | `{ messageId, reactionId, userId }`              | Réaction retirée         |

#### Matches

| Événement                 | Payload                                          | Description                   |
|---------------------------|--------------------------------------------------|-------------------------------|
| `match:created`           | `{ matchId, authorId }`                          | Match créé                    |
| `match:player-joined`     | `{ matchId, userId, participantIds }`            | Joueur a rejoint              |
| `match:started`           | `{ matchId, participantIds }`                    | Match démarré                 |
| `match:set-updated`       | `{ matchId, current_set, set }`                  | Set suivant                   |
| `match:ended`             | `{ matchId, participantIds }`                    | Match terminé                 |
| `match:visibility-changed`| `{ matchId, is_private }`                        | Visibilité changée            |
| `match:score-updated`     | `{ matchId, userId, oldScore, newScore, action, amount }` | Score modifié       |

---

## Authentification

### JWT Tokens

- **Access Token**: Durée de vie courte (15 min par défaut)
- **Refresh Token**: Durée de vie longue (7 jours par défaut)

### Headers

```
Authorization: Bearer <accessToken>
```

### Middleware

Toutes les routes protégées utilisent `authMiddleware` qui:
1. Extrait le token du header `Authorization`
2. Vérifie et décode le JWT
3. Ajoute `req.user = { userId, username }` à la requête

### Erreurs d'authentification

| Code | Message                     | Description                     |
|------|-----------------------------|---------------------------------|
| 401  | Authorization header missing | Pas de header Authorization     |
| 401  | Invalid token format         | Format Bearer incorrect         |
| 401  | Invalid or expired token     | Token invalide ou expiré        |

---

## Variables d'environnement

| Variable           | Default              | Description                    |
|--------------------|----------------------|--------------------------------|
| `JWT_SECRET`       | `your-secret-key`    | Secret pour access tokens      |
| `JWT_EXPIRES_IN`   | `15m`                | Durée de vie access token      |
| `REFRESH_SECRET`   | `your-refresh-secret`| Secret pour refresh tokens     |
| `REFRESH_EXPIRES_IN` | `7d`               | Durée de vie refresh token     |
| `DB_HOST`          | -                    | Hôte PostgreSQL                |
| `DB_PORT`          | `5432`               | Port PostgreSQL                |
| `DB_NAME`          | -                    | Nom de la base                 |
| `DB_USER`          | -                    | Utilisateur PostgreSQL         |
| `DB_PASSWORD`      | -                    | Mot de passe PostgreSQL        |

---

## CORS

Origins autorisées:
- `http://localhost`
- `http://localhost:80`
- `http://localhost:443`
- `http://localhost:5173`
- `https://localhost`
- `https://localhost:443`
