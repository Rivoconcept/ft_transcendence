*This project has been created as part of the 42 curriculum by rhanitra, tramanan, erijania, arajaona, safandri*

# ft_transcendence

## Description
**ft_transcendence** is the final project of the 42 common core curriculum. The goal of this project is to build a modern, real-time web application featuring a fully-functional multiplayer Ping-Pong game, complete with real-time chat, matchmaking, user profiles, and advanced security configurations. 

This project demonstrates proficiency in full-stack web development, real-time communication protocols, database management, and robust DevSecOps practices.

## Instructions

### Prerequisites
To run this project, make sure you have the following installed on your machine:
- **Docker** and **Docker Compose**
- **Make**
- **OpenSSL** (for local certificate generation)

### Setup & Execution
1. **Clone the repository:**
   ```bash
   git clone https://github.com/42-ft-transcendence/ft_transcendence.git
   cd ft_transcendence
   ```

2. **Environment Variables:**
   A `.env.example` file is provided in the `srcs/` directory. Create a `.env` file from it:
   ```bash
   cp srcs/.env.example srcs/.env
   # Update the values inside srcs/.env as needed
   ```

3. **Compilation and Execution:**
   The project is managed via a `Makefile` at the root. To build and start the project in development mode:
   ```bash
   make
   ```
   *Note: This will automatically build the images, create data directories, initialize the Docker volumes, generate local Vault SSL certificates if missing, and start the development environment.*

4. **Production Mode:**
   To launch the production environment featuring the WAF (ModSecurity Nginx proxy) and the production-ready backend:
   ```bash
   make MODE=prod re
   ```

5. **Stop and Clean:**
   ```bash
   make down     # Stops containers and removes volumes
   make fclean   # Performs a complete cleanup (prune)
   ```

## Resources
During the development of this project, the following resources were instrumental:
- [React Documentation](https://react.dev/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [ViteJS Guide](https://vitejs.dev/guide/)
- [TypeORM Documentation](https://typeorm.io/)
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [ModSecurity Reference Manual](https://github.com/SpiderLabs/ModSecurity/wiki)

**AI Usage:**
*(Note: Briefly describe how you used AI for this project, e.g., "AI assistants like Gemini/ChatGPT were used to help configure the Nginx ModSecurity proxy syntax, troubleshoot React-Three-Fiber rendering issues, and assist in automating the Vault initiation scripting.")*

---

## Team Information
- **[login1 / rhanitra]** - *[Role, e.g., Tech Lead & Backend Developer]*
  - Responsible for the Express API, Socket.io real-time interactions, and TypeORM integrations.
- **[login2 / tramanan]** - *[Role, e.g., DevSecOps & Frontend Developer]*
  - Responsible for the HashiCorp Vault infrastructure, Docker configurations, and the React Three Fiber game visualization.
*(Fill in the actual names and adjust responsibilities)*

## Project Management
- **Task Distribution:** Tasks were distributed based on module choices (e.g., Security to Dev 1, Game to Dev 2). We held daily stand-ups to sync up.
- **Organization Tools:** Trello / GitHub Projects were used to track issues and manage the Kanban board.
- **Communication Channels:** Discord was primarily used for voice calls, debugging sessions, and sharing code snippets.

## Technical Stack

### Frontend
- **Framework:** React 19 via Vite. Chosen for its component-based architecture and extremely fast HMR (Hot Module Replacement) during development.
- **Language:** TypeScript for type-safety and better developer experience.
- **State Management:** Jotai. Chosen for its atomic, minimalistic, and flexible state management approach without the boilerplate of Redux.
- **Game Engine:** Three.js and `@react-three/fiber` for rendering a smooth 3D Ping-Pong experience on the canvas.
- **Styling:** Bootstrap and SASS.

### Backend
- **Framework:** Node.js with Express. Express offers a lightweight and highly configurable base for building REST APIs.
- **Language:** TypeScript for strict typing and better integration with Frontend contracts.
- **ORM:** TypeORM. Chosen to easily interface with our PostgreSQL database using decorators and classes.
- **Real-Time:** Socket.io for handling bilateral event-based communication required for the live chat and game ticks.
- **Auth:** JWT (JSON Web Tokens) with Bcrypt for secure password hashing.

### Database System
- **System:** PostgreSQL 16. It is a highly reliable, ACID-compliant relational database management system, perfectly suited to handle relational entities such as Users, Friendships, Matches, and Chat messages.

### DevSecOps & Other Tools
- **Secrets Management:** HashiCorp Vault. Used to inject database credentials and TLS certificates to avoid hardcoding secrets.
- **WAF (Web Application Firewall):** ModSecurity over Nginx. Added in production mode to detect and block malicious web requests (e.g., SQLi, XSS).

## Database Schema
*(Provide a visual representation or description here)*
- **Users Table:** Stores `id`, `username`, `email`, `hashed_password`, `avatar_url`, Setup 2FA configuration.
- **Matches Table:** Stores `id`, `player1_id`, `player2_id`, `score1`, `score2`, `timestamp`.
- **Chat/Messages Table:** Stores `id`, `sender_id`, `receiver_id/channel_id`, `content`, `timestamp`.
- **Friendships/Blocks Table:** Represents relationships between users.

## Features List
- **User Management**: Registration, Login, OAuth (if applied), 2FA setup, and User Profiles displaying match history/stats.
- **Real-time Chat**: Direct messaging, Public/Private channels, blocking users.
- **Multiplayer Game (Pong)**: Real-time 3D rendering with live matchmaking and score tracking.
- **Security Enhancements**: HashiCorp Vault for secrets, ModSecurity for the WAF, hashed passwords.

## Modules
Below are the modules chosen for our transcendence architecture:

1. **[Major] Web: Framework for frontend and backend**
   - *Justification:* We used React (Vite) and Node.js (Express) to enable a robust, scalable full-stack application.
   - *Implementation:* Built a Single Page Application (SPA) communicating with a RESTful API.
   - *Assignee:* [login]

2. **[Major] Web: Implement real-time features using WebSockets**
   - *Justification:* Essential for live multiplayer interactions and chat.
   - *Implementation:* Utilized `Socket.io` for seamless event broadcasting, state syncing, and handling disconnections gracefully.
   - *Assignee:* [login]

3. **[Major] Web: Users interactions (Chat & Profile)**
   - *Justification:* To foster community and provide engaging user experiences.
   - *Implementation:* Created a real-time chat system allowing private/public messages and interactive user profiles.
   - *Assignee:* [login]

4. **[Major] User Management: Standard management and authentication**
   - *Justification:* Secure user handling and customization is critical.
   - *Implementation:* Users can upload avatars, add friends, view online statuses, and edit profile information.
   - *Assignee:* [login]

5. **[Major] User Management: Organization system**
   - *Justification:* Allows users to form guilds, clans, or groups.
   - *Implementation:* Built CRUD controllers/UI for organizations, allowing the addition, edit, and removal of members.
   - *Assignee:* [login]

6. **[Major] Cybersecurity: Implement WAF/ModSecurity & Vault**
   - *Justification:* To protect the application from OWASP threats and secure system credentials.
   - *Implementation:* Deployed a strict ModSecurity Nginx proxy and a standalone HashiCorp Vault container managing database secrets and SSL certificates.
   - *Assignee:* [login]

7. **[Major] Game: Complete web-based game**
   - *Justification:* Core requirement of the final project.
   - *Implementation:* A fully featured real-time Ping-Pong game utilizing `Three.js` (React-Three-Fiber) with clear rules and win/loss conditions.
   - *Assignee:* [login]

8. **[Major] Game: Remote players gameplay**
   - *Justification:* Players must be able to compete across different physical networks.
   - *Implementation:* Game engine loops are synchronized via Socket.io with latency tolerance and disconnection logic.
   - *Assignee:* [login]

9. **[Major] Game: Multiplayer game (More than two players)**
   - *Justification:* Enhances gameplay variety and engine complexity.
   - *Implementation:* Engineered fair synchronization mechanics mapping 3+ clients in the same active real-time game instance.
   - *Assignee:* [login]

10. **[Major] Game: Add another game with history and matchmaking**
    - *Justification:* Provides more competitive content and tracks different player stats.
    - *Implementation:* A secondary distinct game mode featuring match history, statistics tracking, and an automated matchmaking queue.
    - *Assignee:* [login]

11. **[Major] Analytics: Advanced analytics dashboard**
    - *Justification:* Allows users/admins to visualize large amounts of activity data.
    - *Implementation:* Used `recharts` for interactive charts, `jspdf` and `papaparse` for enabling PDF/CSV structured data exports with custom date filters.
    - *Assignee:* [login]

12. **[Minor] Database: Use an ORM for the database**
    - *Justification:* Streamlines complex database transactions and ensures schema sanity.
    - *Implementation:* Integrated `TypeORM` to safely map and query PostgreSQL entities.
    - *Assignee:* [login]

13. **[Minor] Game: Implement spectator mode**
    - *Justification:* Allows users to engage directly with competitive matches without playing.
    - *Implementation:* Implemented read-only real-time WebSockets rooms for viewers of ongoing live games.
    - *Assignee:* [login]

## Individual Contributions
- **[login1]**: 
  - Overcame challenges related to: [e.g., synchronizing ball movement flawlessly across two clients with latency using Socket.io].
  - Implemented the entire Backend structure, TypeORM entities, and the Chat logic.
- **[login2]**: 
  - Overcame challenges related to: [e.g., configuring Vault to correctly authenticate and dispense secrets seamlessly on boot via AppRole].
  - Implemented the DevSecOps pipeline, Dockerfiles, ModSecurity, and the UI layout with React.
