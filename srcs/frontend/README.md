# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

---

# Architecture et Documentation du Projet

## Table des matières

1. [Introduction](#introduction)
2. [Structure du projet](#structure-du-projet)
3. [Concepts de base](#concepts-de-base)
4. [Architecture des couches](#architecture-des-couches)
5. [Routes de l'application](#routes-de-lapplication)
6. [Flux de données](#flux-de-données)
7. [WebSocket et temps réel](#websocket-et-temps-réel)

---

## Introduction

Ce frontend est une application React utilisant TypeScript. Elle communique avec un backend via des appels API REST et des WebSockets pour les mises à jour en temps réel.

### Technologies principales

- **React** : Bibliothèque pour construire l'interface utilisateur
- **TypeScript** : JavaScript avec typage statique
- **Jotai** : Gestion d'état (state management)
- **Axios** : Client HTTP pour les appels API
- **Socket.IO** : Communication WebSocket temps réel
- **React Router** : Navigation entre les pages

---

## Structure du projet

```
src/
├── components/          # Composants réutilisables (Navigation, etc.)
├── models/              # Types et interfaces TypeScript
├── pages/               # Pages de l'application
│   ├── auth/            # Page d'authentification
│   ├── games/           # Pages des jeux
│   └── profile/         # Pages profil et amis
├── providers/           # State management avec Jotai (atoms)
├── services/            # Communication avec l'API (Axios)
├── store/               # Stores globaux (Socket)
└── mainMenu.tsx         # Point d'entrée et configuration des routes
```

---

## Concepts de base

### Qu'est-ce que le State Management ?

Le **state** (état) représente les données qui changent dans votre application. Par exemple :
- L'utilisateur connecté
- La liste des amis
- Les invitations en attente

Le **state management** est la façon dont on organise, stocke et met à jour ces données pour qu'elles soient accessibles partout dans l'application.

**Problème sans state management :**
```
Page A veut savoir si l'utilisateur est connecté
Page B aussi
Page C aussi
→ Chaque page doit récupérer l'info séparément = lent et incohérent
```

**Avec state management :**
```
Un seul endroit stocke "l'utilisateur connecté"
Toutes les pages y accèdent
Quand ça change, toutes les pages sont notifiées automatiquement
```

### Jotai en bref

**Jotai** utilise le concept d'**atoms**. Un atom est une unité de state.

```typescript
// Créer un atom (une donnée partagée)
const countAtom = atom(0);

// Dans un composant React
function Counter() {
    const count = useAtomValue(countAtom);    // Lire
    const setCount = useSetAtom(countAtom);   // Écrire

    return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Types d'atoms utilisés :**

| Type | Description | Exemple |
|------|-------------|---------|
| `atom<T>(value)` | Atom simple avec valeur initiale | `atom<User \| null>(null)` |
| `atom((get) => ...)` | Atom dérivé (calculé à partir d'autres atoms) | Combiner user + relations |
| `atom(null, async (get, set, arg) => ...)` | Atom action (pour les opérations async) | Fetch API, login, etc. |
| `atomFamily` | Crée des atoms dynamiques par clé | Cache d'utilisateurs par ID |

### Axios en bref

**Axios** est une bibliothèque pour faire des requêtes HTTP (GET, POST, PUT, DELETE).

```typescript
// Sans Axios (fetch natif)
const response = await fetch('http://api.com/users');
const data = await response.json();

// Avec Axios (plus simple)
const { data } = await axios.get('http://api.com/users');
```

**Avantages d'Axios :**
- Intercepteurs pour ajouter automatiquement le token d'authentification
- Gestion centralisée des erreurs
- Transformation automatique JSON

---

## Architecture des couches

L'application suit une architecture en couches. Chaque couche a un rôle précis :

```
┌─────────────────────────────────────────────────────────┐
│                    COMPOSANTS (UI)                       │
│         Pages et composants React visibles               │
└─────────────────────────┬───────────────────────────────┘
                          │ useAtomValue / useSetAtom
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    PROVIDERS (State)                     │
│         Atoms Jotai : currentUserAtom, friendsAtom...   │
└─────────────────────────┬───────────────────────────────┘
                          │ appels aux services
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICES (API)                        │
│         userService, invitationService, apiService       │
└─────────────────────────┬───────────────────────────────┘
                          │ requêtes HTTP
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (API REST)                    │
│         http://localhost:3000/api/                       │
└─────────────────────────────────────────────────────────┘
```

### 1. Models (`/models`)

Définit la **structure des données** avec TypeScript.

```typescript
// models/user.model.ts
export interface User {
    id: number;
    username: string;
    realname: string;
    avatar: string;
    is_online: boolean;
}
```

### 2. Services (`/services`)

Gère la **communication avec l'API**. Chaque service est responsable d'un domaine.

**`api.service.ts`** - Service de base :
```typescript
class ApiService {
    private accessToken: string | null = null;

    // Stocke le token pour les requêtes authentifiées
    setToken(token: string) { ... }

    // Méthodes HTTP génériques
    async get<T>(url: string): Promise<T> { ... }
    async post<T>(url: string, data): Promise<T> { ... }
}
```

**`user.service.ts`** - Gestion des utilisateurs :
```typescript
class UserService {
    async login(data) { ... }      // POST /auth/login
    async register(data) { ... }   // POST /auth/register
    async getMe() { ... }          // GET /users/me
    async getById(id) { ... }      // GET /users/:id
}
```

**`invitation.service.ts`** - Gestion des invitations :
```typescript
class InvitationService {
    async getPending() { ... }         // GET /invitations/pending
    async getSent() { ... }            // GET /invitations/sent
    async sendByUsername(username) { ... }  // POST /invitations
    async accept(id) { ... }           // POST /invitations/:id/accept
    async cancel(id) { ... }           // POST /invitations/:id/cancel
    async getFriends() { ... }         // GET /invitations/friends
    async removeFriend(id) { ... }     // DELETE /invitations/friends/:id
}
```

### 3. Providers (`/providers`)

Gère le **state global** avec Jotai. Organise les données et fournit des actions.

#### user.provider.ts

```typescript
// Atom simple : l'utilisateur actuellement connecté
export const currentUserAtom = atom<User | null>(null);

// Atom de chargement
export const currentUserLoadingAtom = atom<boolean>(false);

// AtomFamily : cache d'utilisateurs par ID
export const userFamilyProvider = atomFamily(
    (userId: number) => atom<User | null>(null)
);

// Atom action : login
export const loginAtom = atom(
    null,
    async (_get, set, data: { username: string; password: string }) => {
        const response = await userService.login(data);
        set(currentUserAtom, response.user);
        return response.user;
    }
);
```

#### friend.provider.ts

```typescript
// Relations d'amitié (juste les IDs)
export const friendRelationsAtom = atom<FriendRelation[]>([]);

// Atom dérivé : liste des amis avec détails complets
export const friendsListAtom = atom((get) => {
    const relations = get(friendRelationsAtom);
    const friends: User[] = [];

    for (const relation of relations) {
        const user = get(userFamilyProvider(relation.friendId));
        if (user) friends.push(user);
    }
    return friends;
});
```

#### invitation.provider.ts

Gère les invitations reçues et envoyées avec le même pattern.

### 4. Pages et Composants (`/pages`, `/components`)

L'interface utilisateur. Utilise les providers pour accéder aux données.

```typescript
function FriendsPage() {
    // Lecture du state
    const friends = useAtomValue(friendsListAtom);
    const isLoading = useAtomValue(friendsLoadingAtom);

    // Action pour charger les données
    const fetchFriends = useSetAtom(fetchFriendsAtom);

    useEffect(() => {
        fetchFriends();
    }, []);

    if (isLoading) return <p>Chargement...</p>;

    return (
        <ul>
            {friends.map(friend => (
                <li key={friend.id}>{friend.username}</li>
            ))}
        </ul>
    );
}
```

---

## Routes de l'application

Les routes sont définies dans `mainMenu.tsx` avec React Router.

| Route | Page | Accès | Description |
|-------|------|-------|-------------|
| `/` | AuthPage | Public | Page de connexion/inscription |
| `/games` | GameList | Protégé | Liste des jeux disponibles |
| `/games/diceGame` | DiceGame | Protégé | Jeu de dés |
| `/games/kingOfDiamond` | kingOfDiamond | Protégé | Jeu de nombres |
| `/games/status` | StatusScreen | Protégé | Écran de statut de partie |
| `/games/winner` | WinnerScreen | Protégé | Écran de victoire |
| `/profile/me` | ProfilePage | Protégé | Profil de l'utilisateur |
| `/profile/friends` | FriendsPage | Protégé | Gestion des amis et invitations |

### Protection des routes

```typescript
// Route protégée : redirige vers / si non connecté
function ProtectedRoute({ children }) {
    const user = useAtomValue(currentUserAtom);
    if (!user) return <Navigate to="/" replace />;
    return <>{children}</>;
}

// Route publique : redirige vers /games si déjà connecté
function PublicRoute({ children }) {
    const user = useAtomValue(currentUserAtom);
    if (user) return <Navigate to="/games" replace />;
    return <>{children}</>;
}
```

---

## Flux de données

### Exemple : Connexion utilisateur

```
1. Utilisateur entre username/password
           │
           ▼
2. Composant appelle useSetAtom(loginAtom)
           │
           ▼
3. loginAtom appelle userService.login()
           │
           ▼
4. userService fait POST /auth/login via apiService
           │
           ▼
5. Backend retourne { user, tokens }
           │
           ▼
6. apiService stocke le token dans localStorage
           │
           ▼
7. loginAtom met à jour currentUserAtom
           │
           ▼
8. socketStore se connecte au WebSocket
           │
           ▼
9. Tous les composants utilisant currentUserAtom se re-rendent
           │
           ▼
10. PublicRoute détecte user != null → redirige vers /games
```

### Exemple : Chargement des amis

```
1. FriendsPage se monte
           │
           ▼
2. useEffect appelle fetchFriends()
           │
           ▼
3. fetchFriendsAtom appelle invitationService.getFriends()
           │
           ▼
4. API retourne liste d'utilisateurs (amis)
           │
           ▼
5. Pour chaque ami :
   - Stocké dans userFamilyProvider(ami.id)
   - Relation ajoutée dans friendRelationsAtom
           │
           ▼
6. friendsListAtom (dérivé) recalcule automatiquement
           │
           ▼
7. Composant affiche la liste mise à jour
```

---

## WebSocket et temps réel

### Architecture

```typescript
// store/socketStore.ts - Singleton
class SocketStore {
    private socket: Socket | null = null;

    connect() { ... }
    connectAndAuth(token) { ... }  // Connect + envoie le token
    emit(event, data) { ... }
    on(event, callback) { ... }
    off(event, callback) { ... }
    disconnect() { ... }
}

export const socketStore = SocketStore.getInstance();
```

### Événements écoutés

Le composant `SocketListener` dans `mainMenu.tsx` écoute les événements WebSocket et met à jour les atoms :

| Événement | Action |
|-----------|--------|
| `invitation:received` | Ajoute l'invitation à `receivedInvitationsAtom` |
| `invitation:accepted` | Retire de `sentInvitationsAtom`, ajoute à `friendRelationsAtom` |
| `invitation:declined` | Retire de `sentInvitationsAtom` |
| `invitation:cancelled` | Retire de `receivedInvitationsAtom` et `sentInvitationsAtom` |
| `friend:removed` | Retire de `friendRelationsAtom` |

### Cycle de vie de la connexion

```
1. Au démarrage (refresh avec token existant) :
   initCurrentUserAtom → socketStore.connectAndAuth(token)

2. Au login/register :
   loginAtom/registerAtom → socketStore.connectAndAuth(token)

3. Au logout :
   logoutAtom → socketStore.disconnect() + clear tous les caches
```

---

## Schéma récapitulatif

```
┌────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│                                                                    │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│  │   AuthPage  │     │  GameList   │     │ FriendsPage │  (Pages) │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘          │
│         │                   │                   │                  │
│         └───────────────────┼───────────────────┘                  │
│                             │                                      │
│                    useAtomValue / useSetAtom                       │
│                             │                                      │
│         ┌───────────────────┼───────────────────┐                  │
│         │                   │                   │                  │
│  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐          │
│  │    user     │     │   friend    │     │ invitation  │(Providers)│
│  │  .provider  │◄───►│  .provider  │◄───►│  .provider  │          │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘          │
│         │                   │                   │                  │
│         └───────────────────┼───────────────────┘                  │
│                             │                                      │
│                    Appels aux services                             │
│                             │                                      │
│         ┌───────────────────┼───────────────────┐                  │
│         │                   │                   │                  │
│  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐          │
│  │    user     │     │ invitation  │     │     api     │(Services) │
│  │  .service   │     │  .service   │     │   .service  │          │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘          │
│         │                   │                   │                  │
│         └───────────────────┼───────────────────┘                  │
│                             │                                      │
│                        HTTP (Axios)                                │
│                             │                                      │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (API REST)                          │
│                    http://localhost:3000/api/                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pour aller plus loin

- [Documentation Jotai](https://jotai.org/)
- [Documentation Axios](https://axios-http.com/)
- [Documentation React Router](https://reactrouter.com/)
- [Documentation Socket.IO](https://socket.io/)