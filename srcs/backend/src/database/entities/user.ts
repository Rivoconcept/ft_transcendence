import { Entity, PrimaryGeneratedColumn, Column, OneToMany, type Relation } from "typeorm";
import type { Invitation } from "./invitation.js";
import type { Participation } from "./participation.js";
import type { ChatMember } from "./chat-member.js";
import type { Message } from "./message.js";
import type { UserReaction } from "./user-reaction.js";
import type { Game } from "./game.js";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  realname!: string;

  @Column()
  avatar!: string;

  @Column()
  password!: string;

  @Column({ default: false })
  is_online!: boolean;

  @OneToMany("Invitation", "sender")
  sent_invitations!: Relation<Invitation>[];

  @OneToMany("Invitation", "receiver")
  received_invitations!: Relation<Invitation>[];

  @OneToMany("Game", "author")
  created_games!: Relation<Game>[];

  @OneToMany("Participation", "user")
  participations!: Relation<Participation>[];

  @OneToMany("ChatMember", "user")
  chat_memberships!: Relation<ChatMember>[];

  @OneToMany("Message", "author")
  messages!: Relation<Message>[];

  @OneToMany("UserReaction", "user")
  reactions!: Relation<UserReaction>[];
}