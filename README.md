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

```
   PO: safandri, rhanitra
   PM: arajaona
   Tech Lead: erijania
   Devellopers: tramanan
```

## Project Management

Team work organisation : task distribution, meetings

Communication channels used : Slack


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
| 6 | **Frontend Architecture** | **tramanan** | React structure setup, Vite configuration, and global state initialization with Jotai |
| 7 | **UI/UX & Styling** | **tramanan** | Responsive layouts using Bootstrap 5, Sass customization, and global component design |
| 8 | **DevSecOps & Docker** | **tramanan** | Managing `docker-compose-dev.yml` and `docker-compose-prod.yml`, Nginx reverse proxy, Vault integration |
| 9 | **Chat System (Direct & Group)** | **arajaona** | Implementing group and direct messaging, sending text and images |
| 10 | **Chat Moderation & Management** | **arajaona** | Admin roles, kicking out members, sharing invite links, and message reactions/read receipts |
| 11 | **Card Game Engine** | **safandri** | Implementation of the Card Game algorithms, synchronization, and score processing |
| 12 | **3D Game Integration** | **safandri** | Rendering Card Game events using React Three Fiber and Three.js |
| 13 | **King of Diamond Game** | **rinelfi** | Game mechanics implementation, computing averages, targets, logic and matching logic |
| 14 | **Social & Friend System** | **rinelfi** | Managing friend invitations, blocking relationships, and resolving online status tracking |
| 15 | **User Profiles & Avatars** | **arajaona, rinelfi** | Avatar upload handling, updating profile configurations, displaying play history |
| 16 | **Analytics & Dashboard** | **tramanan, rinelfi** | Exporting activity logic (jsPDF, PapaParse) and visual chart mapping (Recharts) |

## Modules
## Major (2 pt x 15)

### web (4)

* Use a framework for both the frontend and backend.

* Implement real-time features using WebSockets

* Allow users to interact with other users.

* public API

### User Management (2)

* Standard user management and authentication.

* Game statistics and match history

### Cybersecurity (1)

* Cybersecurity Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets

### Gaming (5)

* Implement a complete web-based game where users can play against each

other.

* Remote players — Enable two players on separate computers to play the

same game in real-time.

* Multiplayer game (more than two players).

* Add another game with user history and matchmaking.

* `Implement advanced 3D graphics`

### Data and Analytics (2)

* Advanced analytics dashboard with data visualization.

* Data export and import functionality.

### Modules of choice (1)

*  Lobby System: join, create, delete match



## Minor (11 pt)

### web (4)

* Use an ORM for the database.

* A complete notification system for all creation, update, and deletion actions.

* Allow users to interact with other users.

* public API

### User Management (3)

* Implement a complete 2FA

* User activity analytics and insights dashboard.

* Advanced chat features

### Gaming (2)

* Implement spectator mode for games.

* `Implement a tournament system : Matchmaking system for tournament participants.`

### User Management (1)

* Game statistics and match history

### Data and Analytics (1)

* Data export functionality.



# total 41 pt

## Individual Contributions:

### safandri

### rhanitra

### erijania

### arajaona

### tramanan
- **Cybersecurity Module**: Implemented HashiCorp Vault for secrets management and ModSecurity for Web Application Firewall (WAF) integration.
- **Chat Foundation**: Developed the core architecture and foundation for the real-time chat system.