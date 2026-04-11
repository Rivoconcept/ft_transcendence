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
import { KodWinner, KodRound } from "./entities/KodRound.js";
import { UserOnlineTime } from "./entities/user-online-time.js";
import { MessageRead } from "./entities/message-read.js";
import { ChatModerator } from "./entities/chat-moderator.js";
import { MatchTimer } from "./entities/match-timer.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,

  synchronize: true, // OK for dev only
  logging: false,

  entities: [
    User,
    CardGame,
    Game,
    Match,
    MatchTimer,
    Invitation,
    Participation,
    Chat,
    ChatMember,
    Message,
    Reaction,
    UserReaction,
    BlockedUser,
    KodWinner,
    KodRound,
    UserOnlineTime,
    MessageRead,
    ChatModerator,
  ],
} as DataSourceOptions);
