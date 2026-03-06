import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, type Relation } from "typeorm";
import type { User } from "./user.js";

@Entity()
@Unique(["blocker_id", "blocked_id"])
export class BlockedUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  blocker_id!: number;

  @ManyToOne("User", "blocked_users")
  @JoinColumn({ name: "blocker_id" })
  blocker!: Relation<User>;

  @Column()
  blocked_id!: number;

  @ManyToOne("User", "blocked_by")
  @JoinColumn({ name: "blocked_id" })
  blocked!: Relation<User>;

  @CreateDateColumn()
  created_at!: Date;
}
