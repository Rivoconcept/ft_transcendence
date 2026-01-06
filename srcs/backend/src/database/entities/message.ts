import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.js";
import { Chat } from "./chat.js";
import { UserReaction } from "./user-reaction.js";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type!: MessageType;

  @Column({ type: "text" })
  content!: string;

  @Column()
  author_id!: number;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column()
  chat_id!: number;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  @JoinColumn({ name: "chat_id" })
  chat!: Chat;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => UserReaction, (userReaction) => userReaction.message)
  reactions!: UserReaction[];
}
