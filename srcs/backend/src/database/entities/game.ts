import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, BeforeInsert, JoinColumn, CreateDateColumn, type Relation } from "typeorm";
import type { User } from "./user.js";
import type { Participation } from "./participation.js";

@Entity()
export class Game {
  @PrimaryColumn({ type: "char", length: 4 })
  id!: string;

  @Column({ type: "int", default: 1 })
  set!: number;

  @Column({ type: "int", default: 1 })
  current_set!: number;

  @Column()
  author_id!: number;

  @ManyToOne("User", "created_games")
  @JoinColumn({ name: "author_id" })
  author!: Relation<User>;

  @Column({ default: true })
  is_open!: boolean;

  @Column({ default: false })
  is_private!: boolean;

  @Column({ default: false })
  game_over!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany("Participation", "game")
  participations!: Relation<Participation>[];

  @BeforeInsert()
  generateId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.id = result;
  }
}
