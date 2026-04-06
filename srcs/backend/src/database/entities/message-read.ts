import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Message } from "./message.js";

@Entity()
@Unique(["user_id", "message_id"])
export class MessageRead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @ManyToOne("User")
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column()
  message_id!: number;

  @ManyToOne("Message")
  @JoinColumn({ name: "message_id" })
  message!: Relation<Message>;

  @CreateDateColumn()
  read_at!: Date;
}
