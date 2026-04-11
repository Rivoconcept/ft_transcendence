import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("match_timer")
export class MatchTimer {
  @PrimaryColumn()
  match_id!: string;

  @Column({ type: "bigint" })
  start_time!: number;
}