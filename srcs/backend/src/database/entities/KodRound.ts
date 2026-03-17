import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from "typeorm";

/**
 * One KodRound per game round inside a Match (match_id = Match.id).
 * round_number mirrors Match.current_set so the two stay in sync.
 */
@Entity()
export class KodRound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "char", length: 4 })
  match_id!: string;

  @Column({ type: "int" })
  round_number!: number;

  /** average of all submitted values */
  @Column({ type: "real", nullable: true })
  average!: number | null;

  /** average × 0.8 */
  @Column({ type: "real", nullable: true })
  target!: number | null;

  /** user_id of the round winner */
  @Column({ type: "int", nullable: true })
  winner_id!: number | null;

  @Column({ default: false })
  is_complete!: boolean;

  @OneToMany(() => KodChoice, (c) => c.round, { cascade: true })
  choices!: KodChoice[];

  @CreateDateColumn()
  created_at!: Date;
}

/**
 * Each active player's secret number for one round.
 */
@Entity()
export class KodChoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  user_id!: number;

  @Column({ type: "int" })
  round_id!: number;

  @ManyToOne(() => KodRound, (r) => r.choices)
  @JoinColumn({ name: "round_id" })
  round!: KodRound;

  @Column({ type: "real" })
  value!: number;

  @CreateDateColumn()
  created_at!: Date;
}
