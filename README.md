*This project has been created as part of the 42 curriculum by erijania, safandri, arajaona, tramanan, rhanitra.*

---

## Description

**GameHub** is a real-time multiplayer web application built as the final project of the 42 Common Core. It features a complete real-time chat system (direct and group), a friend and invitation management platform, two online games (Card Game and King of Diamond), user authentication with email OTP verification, a statistics dashboard, and user profile management. The application supports multiple simultaneous users with live updates via WebSockets.

### Key Features
- Real-time direct and group chat with image sharing, read receipts, reactions, and moderation tools
- User authentication with JWT, email OTP verification, forgot/reset password
- Friend system with invitations, user blocking, and live online status
- Two multiplayer games: Card Game and King of Diamond with matchmaking and lobbies
- User profiles with avatar upload, game statistics, and activity tracking
- Statistics dashboard with game history, playtime tracking, and data visualization
- Group chat moderation (moderator roles, kick, invite links, soft delete)
- Containerized deployment with Docker Compose (dev and production configurations)

---

## Instructions

### Prerequisites
- Docker & Docker Compose

### Installation

1. Clone the repository:
   ```bash
   git clone git@vogsphere.42antananarivo.mg:vogsphere/intra-uuid-1875531e-b577-4c64-9541-51ec09420cbc-7151775-arajaona 
   cd ft_transcendence
   ```

2. Copy and configure environment files:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your configuration:
   ```env
   DOMAIN_NAME=localhost
   DATA_PATH=/path/to/your/data
   USER=your_username
   FRONTEND_PORT=5173
   BACKEND_PORT=3000
   PGADMIN_PORT=5050
   WAF_BLOCKING_PARANOIA=3
   WAF_DETECTION_PARANOIA=3
   WAF_MODSEC_RULE_ENGINE=On
   WAF_MODSEC_AUDIT_ENGINE=On
   WAF_MODSEC_REQ_BODY_ACCESS=On
   ```

4. Create secrets directory and file `init.json` in it and edit configuration:
   ```secrets/init.json
   {
       "DB_HOST": "postgres",
       "DB_PORT": "5432",
       "POSTGRES_DB": "postgres",
       "POSTGRES_USER": "postgres",
       "POSTGRES_PASSWORD": "your_db_password",
       "PGADMIN_SERVER_NAME": "postgres",
       "PGADMIN_DEFAULT_EMAIL": "your_pgadmin_email",
       "PGADMIN_DEFAULT_PASSWORD": "your_pgadmin_password",
       "NODE_ENV": "development",
       "BACKEND_PORT": "3000",
       "JWT_SECRET": "your_jwt_secret",
       "JWT_EXPIRES_IN": "15m",
       "REFRESH_SECRET": "your_refresh_secret",
       "REFRESH_EXPIRES_IN": "7d",
       "SMTP_HOST": "smtp.gmail.com",
       "SMTP_PORT": "587",
       "SMTP_USER": "your_address_email",
       "SMTP_PASS": "your_app_password",
       "SMTP_FROM": "your_address_email"
   }
   ```

### Running the project

**Development:**
```bash
make MODE=dev
```

**Production:**
```bash
make
```

### Access

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` (dev) / `https://localhost:8081` (prod) |
| Backend API | `http://localhost:3000/api` (dev) / `https://localhost:8080/api` (prod) |
| PgAdmin | `http://localhost:5050` |

---

## Resources

### Frontend
- [React 19](https://react.dev/) : UI component library
- [Vite 7](https://vitejs.dev/) : Build tool and dev server
- [React Router DOM 7](https://reactrouter.com/) : Client-side routing
- [Bootstrap 5](https://getbootstrap.com/docs/5.3/) : CSS framework for responsive design
- [Jotai](https://jotai.org/) : Atomic state management for React
- [jotai-family](https://www.npmjs.com/package/jotai-family) : Family atoms for parameterized state
- [Axios](https://axios-http.com/) : HTTP client for API calls
- [Socket.IO Client](https://socket.io/docs/v4/client-api/) : Real-time WebSocket communication
- [Recharts](https://recharts.org/) : Data visualization and charting library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) : React renderer for Three.js (3D graphics)
- [Three.js](https://threejs.org/) : 3D JavaScript library
- [SweetAlert2](https://sweetalert2.github.io/) : Toast notifications and alert dialogs
- [FontAwesome React](https://docs.fontawesome.com/web/use-with/react/) : Icon library
- [Radix UI Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip) : Accessible tooltip component
- [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html) : PDF generation in the browser
- [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) : Table plugin for jsPDF
- [PapaParse](https://www.papaparse.com/) : CSV parser for data import/export
- [file-saver](https://github.com/eligrey/FileSaver.js) : File download utility
- [Lucide React](https://lucide.dev/) : Icon set
- [Sass](https://sass-lang.com/) : CSS preprocessor

### Backend
- [Express.js 5](https://expressjs.com/) : Web framework for Node.js
- [TypeORM](https://typeorm.io/) : ORM for TypeScript and PostgreSQL
- [Socket.IO](https://socket.io/docs/v4/) : Real-time bidirectional event-based communication
- [PostgreSQL 16](https://www.postgresql.org/docs/16/) : Relational database
- [pg (node-postgres)](https://node-postgres.com/) : PostgreSQL client for Node.js
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) : JWT token creation and verification
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) : Password hashing
- [Nodemailer](https://nodemailer.com/) : Email sending (OTP verification, password reset)
- [cors](https://github.com/expressjs/cors) : CORS middleware
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) : Decorator metadata for TypeORM

### DevOps
- [Docker](https://docs.docker.com/) : Containerization
- [Docker Compose](https://docs.docker.com/compose/) : Multi-container orchestration
- [Nginx](https://nginx.org/en/docs/) : Reverse proxy and static file server (production)
- [PgAdmin 4](https://www.pgadmin.org/docs/) : PostgreSQL administration tool
- [Harshicop Vault](https://harshicop.com/) : 

### Cybersecurity
- [ModSecurity](https://github.com/owasp-modsecurity/ModSecurity) : Web Application Firewall (WAF) for Nginx


### Testing
- [Jest](https://jestjs.io/) : Testing framework
- [Supertest](https://github.com/ladjs/supertest) : HTTP assertion library
- [ts-jest](https://kulshekhar.github.io/ts-jest/) : TypeScript preprocessor for Jest

### Tutorials & Learning Resources
- [TypeORM - Getting Started](https://typeorm.io/#quick-start)
- [Socket.IO - Get Started](https://socket.io/get-started/chat)
- [React - Quick Start](https://react.dev/learn)
- [Express.js - Getting Started](https://expressjs.com/en/starter/installing.html)
- [Docker Compose - Getting Started](https://docs.docker.com/compose/gettingstarted/)
- [JWT Introduction](https://jwt.io/introduction)
- [HashiCorp Vault - Secure Introduction](https://developer.hashicorp.com/vault/tutorials/app-integration/secure-introduction) : Secrets management and securing application introduction

### AI Usage
AI assistant **Claude** (Anthropic) was used during development to:
- Generate boilerplate code for repetitive backend patterns (controllers, services, routes)
- Help debug Socket.IO synchronization and reconnection issues
- Draft unit test templates for API endpoints (Game, Match)
- Assist with TypeORM entity relationship definitions
- Help design the chat moderation and blocking architecture
- Generate CSS styling patterns for Bootstrap components
- Assist with Jotai state management patterns
- Help with documentation writing
- Help with frontend layouts component

All AI-generated content was reviewed, understood, tested, and adapted by team members before integration into the project.

---

## Team Information

| Member | Role(s) | Responsibilities |
|--------|---------|-----------------|
| **safandri** | Product Owner, Developer | Defined the product vision and prioritized features. Maintained the product backlog and validated completed work. Developed the frontend architecture, King of Diamond game, and lobby system. |
| **arajaona** | Project Manager, Developer | Organized team meetings and planning sessions. Tracked progress, deadlines, and blockers. Ensured team communication. Developed user profiles, avatars, and the analytics dashboard. |
| **erijania** | Tech Lead, Developer | Defined technical architecture and made technology stack decisions. Reviewed critical code changes and ensured code quality. Developed backend foundation, Socket.IO integration, authentication, OTP verification, chat system, chat moderation, social/friend system, and user profiles. |
| **tramanan** | Developer | Developed the chat system, Docker/DevSecOps infrastructure, and the full cybersecurity module (ModSecurity WAF + HashiCorp Vault). |
| **rhanitra** | Developer | Developed the Card Game engine, 3D game integration with React Three Fiber/Three.js, and contributed to Docker/DevSecOps infrastructure. |

## Project Management

Tasks were assigned according to availability, capability, and personal desires. The team physically met every Saturday for briefing sessions to review progress, plan upcoming work, and resolve blockers. Day-to-day communication happened on Slack to keep everyone aligned between meetings.


## Technical Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend Framework** | React | 19.2.0 | Modern component-based UI with hooks, large ecosystem |
| **Build Tool** | Vite | 7.2.4 | Fast HMR, native ES modules, optimized builds |
| **State Management** | Jotai | 2.17.1 | Lightweight atomic state, simpler than Redux for our scale |
| **Styling** | Bootstrap + Sass | 5.3.8 | Rapid responsive design with custom theming |
| **3D Graphics** | React Three Fiber + Three.js | 9.5.0 / 0.182.0 | Immersive card game rendering |
| **Charts** | Recharts | 2.12.7 | Declarative React-based data visualization |
| **Backend Framework** | Express.js | 5.2.1 | Mature, flexible Node.js framework with TypeScript |
| **ORM** | TypeORM | 0.3.28 | Decorator-based entity definitions, migration support |
| **Real-time** | Socket.IO | 4.8.1 | Reliable WebSocket with rooms, fallback, and reconnection |
| **Database** | PostgreSQL | 16 | Robust relational DB with strong data integrity |
| **Authentication** | JWT + bcrypt | 9.0.2 / 5.1.1 | Stateless auth with secure password hashing |
| **Email** | Nodemailer | 8.0.4 | OTP verification and password reset emails |
| **Language** | TypeScript | 5.9.3 | Type safety across frontend and backend |
| **Runtime** | Node.js | 22 (Alpine) | LTS runtime for backend |
| **Containerization** | Docker Compose | - | Consistent dev/prod environments |
| **Reverse Proxy/WAF** | Nginx + ModSecurity | Alpine | SSL termination, static serving, WebSocket proxying |
| **PDF Export** | jsPDF + AutoTable | 2.5.1 | Client-side PDF generation for reports |
| **CSV** | PapaParse | 5.4.1 | Data import/export functionality |

---

## Database Schema

### Entities and Relationships

```text
User ──────────────────────────────────────────────────────────
 │  id, username (unique), email (unique), avatar,
 │  password, is_online, is_confirmed, otp_code, otp_expiration
 │
 ├──< Invitation (sender_id / receiver_id)
 │      id, sender_id, receiver_id, status [PENDING/ACCEPTED/DECLINED], created_at
 │
 ├──< BlockedUser (blocker_id / blocked_id)
 │      id, blocker_id, blocked_id, created_at
 │      UNIQUE(blocker_id, blocked_id)
 │
 ├──< ChatMember (user_id)
 │      id, user_id, chat_id ──> Chat
 │
 ├──< ChatModerator (user_id)
 │      id, user_id, chat_id ──> Chat
 │      UNIQUE(user_id, chat_id)
 │
 ├──< Message (author_id)
 │      id, type [TEXT/IMAGE], content, author_id, chat_id, deleted, created_at, updated_at
 │      │
 │      ├──< MessageRead (message_id)
 │      │      id, user_id, message_id, read_at
 │      │      UNIQUE(user_id, message_id)
 │      │
 │      └──< UserReaction (message_id)
 │             id, user_id, message_id, reaction_id ──> Reaction
 │             UNIQUE(user_id, message_id, reaction_id)
 │
 ├──< Match (author_id)
 │      id (char 4), set, current_set, author_id, game_id, is_open, is_private,
 │      match_over, has_begun, is_limited, participations_limit, created_at
 │      │
 │      └──< Participation (match_id)
 │             id, user_id, match_id, score
 │
 ├──< CardGame (author_id)
 │      id, mode [SINGLE/MULTI], player_name, final_score, is_win, match_id, created_at
 │
 ├──< UserReaction (user_id)
 │
 └──< UserOnlineTime (user_id)
        id, user_id, date (YYYY-MM-DD), minutes, created_at, updated_at

Chat ──────────────────────────────────────────────────────────
   id, name, channel_id (unique), type [DIRECT/GROUP], created_at
   ├──< ChatMember
   ├──< ChatModerator
   └──< Message

Game ──────────────────────────────────────────────────────────
   id, name
   └──< Match (game_id)

Reaction ──────────────────────────────────────────────────────
   id, code (unique)
   └──< UserReaction (reaction_id)

KodRound ──────────────────────────────────────────────────────
   id, match_id (char 4), round_number, average, target, target_rounded,
   winner_user_id, winner_name, is_exact_hit, choices (jsonb), created_at

KodWinner ─────────────────────────────────────────────────────
   id, match_id (char 4), winner_user_id, winner_name,
   remaining_points, total_rounds, created_at
```

### Summary
- **17 entities** total
- Central entity: **User** with relations to all major features
- **Chat** system: Chat -> ChatMember, ChatModerator, Message -> MessageRead, UserReaction
- **Game** system: Game -> Match -> Participation, plus CardGame and KodRound/KodWinner
- **Social** system: Invitation, BlockedUser, UserOnlineTime

---

## Features List

| # | Feature | Member(s) | Description |
|---|---------|-----------|-------------|
| 1 | **Backend foundation** | **erijania** | Express.js setup, TypeORM data source, Docker configuration, entity definitions (Chat, Message, Game, Match, Invitation, Reaction, UserReaction) |
| 2 | **Socket.IO integration** | **erijania** | Server and client connection setup, room management, event-driven architecture for all real-time features |
| 3 | **User registration & login** | **erijania** | JWT-based authentication with access/refresh tokens, bcrypt password hashing, LoginForm and RegisterForm components |
| 4 | **Token refresh** | **erijania** | Automatic token refresh on 401 responses, interceptor-based seamless renewal |
| 5 | **Email & OTP verification** | **erijania** | Nodemailer integration for account validation and password resets functionality |
| 6 | **Frontend Architecture** | **safandri** | React structure setup, Vite configuration, and global state initialization with Jotai |
| 7 | **UI/UX & Styling** | **all members** | Responsive layouts using Bootstrap 5, Sass customization, and global component design |
| 8 | **DevSecOps & Docker** | **tramanan, rhanitra, erijania** | Managing `docker-compose-dev.yml` and `docker-compose-prod.yml`, Nginx reverse proxy, Vault integration |
| 9 | **Chat System (Direct & Group)** | **tramanan, erijania** | Implementing group and direct messaging, sending text and images |
| 10 | **Chat Moderation & Management** | **erijania** | Admin roles, kicking out members, sharing invite links, and message reactions/read receipts |
| 11 | **Card Game Engine** | **rhanitra** | Implementation of the Card Game algorithms, synchronization, and score processing |
| 12 | **3D Game Integration** | **rhanitra** | Rendering Card Game events using React Three Fiber and Three.js |
| 13 | **King of Diamond Game** | **safandri** | Game mechanics implementation, computing averages, targets, logic and matching logic |
| 14 | **Social & Friend System** | **erijani** | Managing friend invitations, blocking relationships, and resolving online status tracking |
| 15 | **User Profiles & Avatars** | **arajaona, erijania** | Avatar upload handling, updating profile configurations, displaying play history |
| 16 | **Analytics & Dashboard** | **arajaona** | Exporting activity logic (jsPDF, PapaParse) and visual chart mapping (Recharts) |

## Modules

> Required: **14 points minimum** (Major = 2pt, Minor = 1pt).

---

### Major Modules (2pt each)

#### 1. Web — Use a Framework for both the Frontend and Backend

| | |
|---|---|
| **Members** | all members |
| **Points** | 2 |

**Implementation:** React 19 with Vite 7 for the frontend. Express.js 5 with TypeScript for the backend. Structured with controllers, services, entities, and middleware.

**Why this module over alternatives:**
We could have claimed "Use a frontend framework" (minor, 1pt) and "Use a backend framework" (minor, 1pt) separately for the same 2 points. However, the Major version requires demonstrating that both frameworks work together as a coherent full-stack system — shared TypeScript types, coordinated API contracts, and consistent dev/build tooling — which better reflects how our application is actually built. Alternatively, we could have used a full-stack framework like Next.js to cover both in one tool, but our project needs a decoupled frontend/backend architecture since the backend serves both REST endpoints and WebSocket connections independently.

---

#### 2. Web — Implement Real-time Features using WebSockets

| | |
|---|---|
| **Members** | all members but tramanan |
| **Points** | 2 |

**Implementation:** Socket.IO 4.8 with room-based architecture powering: match lifecycle (`match:player-joined`, `match:started`, `match:result`, `match:score-updated`), game synchronization (`kod:initialized`, `kod:submit`, `publish_result`), chat messaging (`chat:join`, `chat:leave`), and live online status broadcasting. Connection/disconnection handled with automatic room cleanup and reconnection logic.

**Why this module:**
A multiplayer gaming and chat platform without real-time communication would require constant HTTP polling, creating unacceptable latency for game synchronization and chat delivery. This module is the backbone that makes all other gaming, chat, and social modules actually work in real-time. We considered building features over REST-only (with polling), but the Card Game and King of Diamond both require sub-second state synchronization across players — something only WebSockets can reliably deliver.

---

#### 3. Web — Allow Users to Interact with Other Users

| | |
|---|---|
| **Members** | tramanan, erijania |
| **Points** | 2 |

**Implementation:**
- **Chat system:** Direct and group messaging with text and image support, delivered in real-time via Socket.IO.
- **Profile system:** User profile pages displaying username, avatar, online status, game statistics, and match history.
- **Friends system:** Friend invitations (send/accept/decline), friends list with live online status indicators, and user blocking.

**Why this module:**
The alternative was to not include social features and focus purely on games — but a gaming platform without user interaction is just a series of isolated matches with no community. This module transforms the application from "two games served on a website" into a social platform where players can find friends, communicate, and build relationships around gameplay.

---

#### 4. User Management — Standard User Management and Authentication

| | |
|---|---|
| **Members** | erijania, arajaona |
| **Points** | 2 |

**Implementation:**
- JWT-based authentication with access tokens (15min) and refresh tokens (7 days), bcrypt password hashing.
- Profile updates (username, email, avatar upload with default fallback).
- Friends system with add/remove and live online status visibility.
- Profile page displaying user information, game history, and statistics.

**Why this module:**
Every other module in our project depends on knowing who the user is — games need player identities, chat needs sender/receiver, statistics need to be attributed, and friends need to be linked. We considered the "Advanced permissions system" major module (CRUD users, roles, admin views) as an alternative, but our application is a peer-to-peer gaming platform, not an admin-managed system — standard user management fits the actual use case.

---

#### 5. Gaming — Implement a Complete Web-based Game

| | |
|---|---|
| **Members** | rhanitra |
| **Points** | 2 |

**Implementation:** **Card Game** — a 3-card reveal game with distinct phases: BEGIN, SHUFFLE, PLAY, and SHOW_RESULT. Rng-based scoring, scores are computed server-side, and results are synchronized across all clients. Clear win/loss conditions based on card values and scoring rules.

**Why this module:**
This is the foundational gaming module — without it, five other modules (Remote players, Multiplayer 3+, Another game, 3D graphics, Game statistics) cannot exist. We chose a card game over a Pong-like or board game because: (1) it naturally supports 3+ players without the complexity of real-time physics synchronization, and (2) it provides strong 3D visual potential (card flipping, textures, animations) that a 2D paddle game cannot match, directly enabling the "Advanced 3D graphics" module.

---

#### 6. Gaming — Remote Players

| | |
|---|---|
| **Members** | rhanitra, safandri |
| **Points** | 2 |

**Implementation:** Players on separate machines join the same match via Socket.IO rooms (`match.{matchId}`). The server holds the authoritative game state — all actions are validated server-side, and results are broadcast to all participants. Disconnection handling with automatic player removal and match state updates.

**Why this module:**
A web-based multiplayer game where all players must be on the same machine is not a real web application. Remote play is what transforms the Card Game and King of Diamond from local demos into networked multiplayer experiences. We chose this over "AI Opponent" because human-vs-human gameplay is the core value proposition of our platform — an AI opponent would serve solo players but would not justify the WebSocket infrastructure we built. Remote play leverages that infrastructure and gives it purpose.

---

#### 7. Gaming — Multiplayer Game (More than Two Players)

| | |
|---|---|
| **Members** | safandri, rhanitra |
| **Points** | 2 |

**Implementation:** Multiple players join the same lobby and play simultaneously. Both Card Game and King of Diamond support 3+ concurrent participants with state synchronized across all clients.

**Why this module:**
King of Diamond's core mechanic (calculating 2/3 of the group average) only becomes meaningful with 3+ players — with just 2 players it reduces to a trivial guessing game. The Card Game also gains strategic depth with more opponents. We chose this over "Game customization" (power-ups, maps, settings) because expanding the player count fundamentally changes gameplay dynamics, while cosmetic customization would only change appearance. We also considered "Spectator mode" but active participation for 3+ players adds more gameplay value than passive watching.

---

#### 8. Gaming — Add Another Game with User History and Matchmaking

| | |
|---|---|
| **Members** | safandri |
| **Points** | 2 |

**Implementation:** **King of Diamond** — an auction-style number game where players choose a number between 0 and 100, and the player closest to 2/3 of the group's average wins the round. Implemented with `KodGameManager` handling round-based scoring (10 starting points, 0.8 multiplier per round), player elimination, and round history. Match history tracked per user via the Participation entity. Matchmaking via `matchmake()` (finds open matches) and `discoverMatches()` (lists public lobbies).

**Why this module:**
A platform with only one game has limited replay value — players who don't enjoy card games would leave. King of Diamond offers a psychologically distinct experience (strategy and group psychology vs. card luck), attracting a different player profile. We chose a number/strategy game over chess or tic-tac-toe because those are inherently 2-player games and would conflict with our "Multiplayer 3+" module. King of Diamond is designed for groups, making it a natural complement to both the Card Game and the multiplayer architecture.

---

#### 9. Gaming — Implement Advanced 3D Graphics

| | |
|---|---|
| **Members** | rhanitra |
| **Points** | 2 |

**Implementation:** React Three Fiber + Three.js (v0.182.0) for rendering the Card Game in 3D. Components include `RevealCard.tsx` (textured card geometry with UV mapping and rotation animations), `CardScene.tsx` (Canvas with multiple card slots and camera setup), and `CardBack.tsx` (back face rendering). Features texture loading, shader-based UV mapping, and smooth flip/rotation animations.

**Why this module:**
A card game displayed as flat 2D images would look like a basic web form — not an engaging gaming experience. 3D rendering transforms card reveals into immersive animations that create tension and excitement.

---

#### 10. Cybersecurity — Implement WAF/ModSecurity (Hardened) + HashiCorp Vault for Secrets

| | |
|---|---|
| **Members** | tramanan |
| **Points** | 2 |

**Implementation:**
- **WAF:** ModSecurity 3.0 compiled with Nginx 1.26, configured with OWASP Core Rule Set v4.7.0. Paranoia level configurable via environment variables. Request body inspection, response filtering, and audit logging enabled.
- **Secrets:** HashiCorp Vault with Raft storage backend, AppRole-based authentication, and agent-based secret distribution. Manages SSL certificates, database credentials, JWT secrets, and SMTP credentials — all injected at runtime via `/run/secrets/GameHub`.

**Why this module:**
Our application handles user credentials, personal data, and payment-adjacent functionality (game scores, rankings) — exposing it without a WAF would leave it vulnerable to OWASP Top 10 attacks (SQL injection, XSS, CSRF). Storing secrets in `.env` files (as many projects do) means a single file leak exposes everything. We chose this cybersecurity module over "Monitoring with Prometheus/Grafana" (DevOps major) because security incidents cause irreversible damage (data breaches, account compromise), while performance issues are recoverable. We also considered "ELK logging" (DevOps major) but WAF + Vault directly protects users, while logging only helps developers after an incident.

---

#### 11. User Management — An Organization System

| | |
|---|---|
| **Members** | tramanan, erijania |
| **Points** | 2 |

**Implementation:** Group chat channels serve as the organization system:
- **Create** group chats with a name and unique channel ID.
- **Add users** to groups via invite links or direct invitation.
- **Remove users** from groups (moderator kick functionality).
- **Roles within groups:** ChatModerator roles with elevated permissions (kick members, soft-delete messages, manage invite links).
- **Organization-specific actions:** Members can send messages, share images, react to messages, and view other members' profiles within the group context.

**Why this module:**
Our platform is centered around multiplayer gaming — players naturally form communities around the games they play. A group chat with moderation and roles is the most relevant form of "organization" for a gaming platform. We chose this over the "Advanced permissions system" major module (admin/user/guest roles with CRUD) because our users are peers who organize informally around games, not employees in a hierarchy. We also considered not claiming this module, but the group chat system with its moderation roles, member management, and invite system fulfills all the subject's requirements: create/edit/delete organizations, add/remove users, and allow users to perform specific actions within the organization.

---

#### 12. Data and Analytics — Advanced Analytics Dashboard with Data Visualization

| | |
|---|---|
| **Members** | arajaona |
| **Points** | 2 |

**Implementation:**
- **Interactive charts:** `gameStatsCard.tsx` (Recharts PieChart for win/loss distribution), `onlineTimeCard.tsx` (Recharts BarChart for online time by month).
- **Export functionality:** PDF export via jsPDF + jspdf-autotable, CSV export via PapaParse — accessible from `FullGameHistory.tsx`.
- **Customizable filters:** Game history filtering by game type in `GameHistoryCard.tsx` and `FullGameHistory.tsx`.
- **Data points:** Win/loss records, per-game stats, online time tracking via `UserOnlineTime` entity, full match history with opponents and scores.

**Why this module:**
Players need visibility into their performance over time — without a dashboard, game results are ephemeral events with no lasting value. We chose this over "Monitoring with Prometheus/Grafana" (DevOps major) because player-facing analytics directly enhance user engagement, while infrastructure monitoring only serves developers. We also preferred this over "Backend as microservices" (DevOps major) because data visualization creates tangible user value, while microservices is an architectural pattern invisible to end users.

---

### Minor Modules (1pt each)

#### 1. Web — Use a Frontend Framework

| | |
|---|---|
| **Members** | all members |
| **Points** | 1 |

**Implementation:** React 19 with Vite 7 as build tool, Jotai for atomic state management, React Router DOM 7 for client-side routing, Sass + Bootstrap 5 for styling.

**Why this module:**
A multi-page gaming platform with real-time updates, 3D rendering, and complex state (lobbies, chats, user sessions) cannot be built with vanilla JavaScript without reinventing component lifecycle, routing, and state management. We chose this over "PWA with offline support" (minor) because our application is inherently online (multiplayer games + real-time chat), making offline support irrelevant, while a frontend framework is essential for building the UI.

---

#### 2. Web — Use a Backend Framework

| | |
|---|---|
| **Members** | all members but tramanan |
| **Points** | 1 |

**Implementation:** Express.js 5 with TypeScript, structured with controllers, services, entities, middleware, and route definitions. Serves both REST API endpoints and Socket.IO WebSocket connections.

**Why this module:**
The backend handles 18 database entities, authentication flows, game logic, real-time events, and file uploads — managing this without a framework would mean writing HTTP parsing, routing, and middleware from scratch. We chose this over "Server-Side Rendering (SSR)" (minor) because our application is a real-time SPA where client-side rendering + WebSockets is the natural pattern — SSR would add complexity without benefit for a gaming platform that doesn't need SEO.

---

#### 3. Web — Use an ORM for the Database

| | |
|---|---|
| **Members** | all members but tramanan |
| **Points** | 1 |

**Implementation:** TypeORM with PostgreSQL 16. 18 entities defined using TypeScript decorators with full relation mapping (OneToMany, ManyToOne). Entities include User, Chat, Message, Match, Participation, Game, Invitation, BlockedUser, ChatMember, ChatModerator, CardGame, KodRound, KodWinner, MessageRead, UserReaction, Reaction, UserOnlineTime, and MatchTimer.

**Why this module:**
With 18 entities and complex relations (User linked to matches, chats, invitations, reactions, blocked users, and online time), writing raw SQL queries would be error-prone and unmaintainable. An ORM provides type-safe queries, automatic relation loading, and migration support. We chose this over "Multiple languages / i18n" (minor) because data integrity across 18 related entities is a core requirement, while internationalization is a nice-to-have for a school project.

---

### Modules of Choice

#### 1. (Minor) Lobby System — 1pt

| | |
|---|---|
| **Members** | safandri |
| **Points** | 1 |

**Implementation:** A complete match lobby system:
- **Create** matches with configurable settings (public/private, player limit, game selection).
- **Join** matches via match ID, lobby discovery (`discoverMatches`), or quick match (`matchmake`).
- **Manage** lobbies with real-time player list, ready state, and creator-initiated start.
- **Leave** matches before game start with proper cleanup.

Frontend: `MultiplayerLobby.tsx` (lobby view with player list) and `MultiplayerSetup.tsx` (create/join/quick match interface).

**Why this module deserves 1 point:**
The subject defines modules for games, remote play, and multiplayer — but none of them address how players actually find and organize matches. Without a lobby system, players would need to coordinate externally (sharing match IDs via chat or other means), creating a broken user flow. The lobby system bridges the gap between "a game exists" and "players can actually find each other and play."

We considered implementing "Spectator mode" (minor) or "Tournament system" (minor) instead, but both assume players are already in matches. The lobby system solves the prerequisite problem: before you can watch a game (spectator) or organize a tournament, players need a way to discover, join, and start matches — which is exactly what the lobby provides.

**Technical scope:** The lobby system required extending the Match entity with visibility and limit fields, creating REST endpoints for match discovery and matchmaking, implementing WebSocket events for real-time lobby updates (player join/leave/ready), and building two dedicated frontend components — making it a meaningful minor module.

---

#### 2. (Minor) Email OTP Authentication — 1pt

| | |
|---|---|
| **Members** | erijania |
| **Points** | 1 |

**Implementation:** 6-digit OTP codes generated server-side and sent via Nodemailer (SMTP) for two flows:
- **Account confirmation:** After registration, users must validate their email by entering the OTP sent to their inbox before accessing the platform.
- **Password reset:** Users who forgot their password receive an OTP to verify their identity before setting a new password.

OTP codes expire after 60 seconds. Backend service (`otpService`) handles generation, validation, and expiration. Frontend component (`OtpPage.tsx`) provides the verification interface.

**Why this module deserves 1 point:**
The subject's mandatory part requires "email and password authentication with proper security" but does not require email verification — users could register with any email without proof of ownership. OTP verification adds a layer of identity assurance that prevents fake account creation and provides a secure password recovery path. We chose this over implementing "OAuth 2.0" (minor, remote authentication with Google/GitHub/42) because OTP email verification solves two problems (account confirmation + password recovery) while OAuth only solves one (login convenience). We also preferred this over "2FA" (minor) because 2FA on every login adds friction to a gaming platform where players want quick access, while OTP on registration and password reset strikes the right balance between security and usability.

**Technical scope:** Required Nodemailer SMTP integration, OTP generation/expiration logic, database fields on the User entity (`otp_code`, `otp_expiration`), two backend endpoints (`/api/otp/public/generate`, `/api/otp/public/validate`), and a dedicated frontend page — making it a meaningful minor module.

---

### Points Summary

| Type | Count | Points per Module | Subtotal |
|------|-------|-------------------|----------|
| Major modules | 12 | 2 | **24** |
| Minor modules | 3 | 1 | **3** |
| Modules of choice (minor) | 2 | 1 | **2** |
| **Total** | **17** | | **29 pt** |

---

## Individual Contributions

### erijania — Tech Lead, Developer
- **Backend foundation:** Set up Express.js 5 with TypeScript, configured TypeORM data source, defined core entities (Chat, Message, Game, Match, Invitation, Reaction, UserReaction), and structured the project into controllers, services, and middleware.
- **Socket.IO integration:** Implemented server and client WebSocket setup, room management for matches and chats, and the event-driven architecture used by all real-time features.
- **User authentication:** Built JWT-based authentication with access/refresh token rotation, bcrypt password hashing, automatic token refresh on 401 responses via Axios interceptors, and the LoginForm/RegisterForm components.
- **Email OTP verification:** Integrated Nodemailer for SMTP-based 6-digit OTP delivery, account confirmation flow, and password reset functionality.
- **Chat system:** Implemented group and direct messaging with text and image support (with tramanan).
- **Chat moderation & management:** Built moderator roles with elevated permissions, member kick functionality, shareable invite links, message reactions with emoji support, and read receipts.
- **Social & Friend system:** Built friend invitations (send/accept/decline), user blocking via `BlockedUser` entity, and live online status tracking.
- **User profiles & avatars:** Developed avatar upload handling, profile configuration updates, and play history display (with arajaona).
- **DevSecOps & Docker:** Contributed to Docker Compose configurations and Nginx reverse proxy setup (with tramanan, rhanitra).
- **UI/UX styling:** friends page, profile page, avatar styling.
- **Module contributions:** WebSockets (Major), User interaction (Major), Standard user management (Major), Organization system (Major), Backend framework (Minor), ORM (Minor), Email OTP Authentication (Module of choice).

### tramanan — Developer
- **Chat system:** Implemented group and direct messaging with text and image support (with erijania).
- **DevSecOps & Docker:** Managed `docker-compose-dev.yml` and `docker-compose-prod.yml`, configured Nginx reverse proxy for production, and integrated HashiCorp Vault for secret injection (with rhanitra, erijania).
- **Cybersecurity:** Compiled and configured ModSecurity 3.0 with OWASP CRS v4.7.0 as a WAF on Nginx, set up HashiCorp Vault with Raft storage and AppRole-based authentication for secrets distribution.
- **UI/UX styling:** Message page styling.
- **Module contributions:** Framework (Major), User interaction (Major), Cybersecurity (Major), Organization system (Major), Analytics dashboard (Major), Frontend framework (Minor).

### arajaona — Project Manager, Developer
- **User profiles & avatars:** Developed avatar upload handling, profile configuration updates, and play history display (with erijania).
- **Analytics dashboard:** Built interactive charts (Recharts PieChart for game stats, BarChart for online time), export functionality (PDF via jsPDF, CSV via PapaParse), and game history with filtering.
- **UI/UX styling:** dashboard, landing page, legals page styling.
- **Module contributions:** Standard user management (Major), Analytics dashboard (Major), ORM (Minor).

### safandri — Product Owner, Developer
- **Frontend architecture:** Set up React 19 project structure with Vite 7, configured Jotai for global state management, and established the base routing with React Router DOM.
- **King of Diamond game:** Implemented the game mechanics with `KodGameManager` — number selection (0-100), 2/3 average calculation, round-based scoring (10 starting points, 0.8 multiplier), player elimination, and round history tracking.
- **Lobby system:** Built the match lobby frontend (`MultiplayerLobby.tsx`, `MultiplayerSetup.tsx`) with create/join/quick match flows and real-time player list updates.
- **UI/UX styling:** genral UI, Games page styling.
- **Module contributions:** Remote players (Major), Multiplayer 3+ (Major), Another game — King of Diamond (Major), Lobby system (Module of choice).

### rhanitra — Developer
- **Card Game engine:** Implemented the Card Game algorithms with phase management (BEGIN, SHUFFLE, PLAY, SHOW_RESULT), server-side score computation, and result synchronization across clients.
- **3D game integration:** Rendered the Card Game in 3D using React Three Fiber and Three.js — built `RevealCard.tsx` with textured geometry and UV mapping, `CardScene.tsx` with multi-slot canvas, and `CardBack.tsx` with flip/rotation animations.
- **DevSecOps & Docker:** Contributed to Docker Compose configurations and Nginx reverse proxy setup (with tramanan, erijania).
- **UI/UX styling:** Card Game page styling.
- **Module contributions:** Complete web-based game — Card Game (Major), Remote players (Major), Multiplayer 3+ (Major), Advanced 3D graphics (Major).
