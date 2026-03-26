// /home/hrv/Pictures/ft_transcendence/srcs/backend/src/database/data-source.ts

import "reflect-metadata";
import { DataSource } from "typeorm";
import { DataSourceOptions } from "typeorm/browser";
import { User } from "./entities/user.js";
import { Game } from "./entities/game.js";
import { CardGame } from "./entities/card-game.js";
import { Match } from "./entities/match.js";
import { Invitation } from "./entities/invitation.js";
import { Participation } from "./entities/participation.js";
import { Chat } from "./entities/chat.js";
import { ChatMember } from "./entities/chat-member.js";
import { Message } from "./entities/message.js";
import { Reaction } from "./entities/reaction.js";
import { UserReaction } from "./entities/user-reaction.js";
import { BlockedUser } from "./entities/blocked-user.js";

let actualInstance: DataSource | null = null;

export const AppDataSource = new Proxy({} as DataSource, {
  get(target, prop, receiver) {
    if (!actualInstance) {
      throw new Error(
        `❌ Critical Error: Attempted to access AppDataSource.${String(prop)} before Vault secrets were loaded!`
      );
    }
    return Reflect.get(actualInstance, prop, receiver);
  }
});

// Cette fonction sera appelée dans ton index.ts APRÈS loadSecrets()
export const initializeDataSource = () => {
  actualInstance = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD, // Enfin lu depuis Vault !
    database: process.env.POSTGRES_DB,
  
    synchronize: true,
    logging: true,
  
    entities: [
      User,
      CardGame,
      Game,
      Match,
      Invitation,
      Participation,
      Chat,
      ChatMember,
      Message,
      Reaction,
      UserReaction,
      BlockedUser,
    ],
  } as DataSourceOptions);

  return actualInstance;
};
