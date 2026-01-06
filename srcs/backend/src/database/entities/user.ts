import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Invitation } from "./invitation.js";
import { Participation } from "./participation.js";
import { ChatMember } from "./chat-member.js";
import { Message } from "./message.js";
import { UserReaction } from "./user-reaction.js";
import { Game } from "./game.js";

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

  @OneToMany(() => Invitation, (invitation) => invitation.sender)
  sent_invitations!: Invitation[];

  @OneToMany(() => Invitation, (invitation) => invitation.receiver)
  received_invitations!: Invitation[];

  @OneToMany(() => Game, (game) => game.author)
  created_games!: Game[];

  @OneToMany(() => Participation, (participation) => participation.user)
  participations!: Participation[];

  @OneToMany(() => ChatMember, (chatMember) => chatMember.user)
  chat_memberships!: ChatMember[];

  @OneToMany(() => Message, (message) => message.author)
  messages!: Message[];

  @OneToMany(() => UserReaction, (userReaction) => userReaction.user)
  reactions!: UserReaction[];
}