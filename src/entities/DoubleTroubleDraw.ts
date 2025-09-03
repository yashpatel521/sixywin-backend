import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

import { DoubleTrouble } from "./DoubleTrouble";

@Entity()
export class DoubleTroubleDraw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  winningNumbers: number;

  @Column({ type: "timestamp" })
  nextDrawTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  // All bets associated with this draw result
  @OneToMany(() => DoubleTrouble, (bet) => bet.drawResult)
  bets: DoubleTrouble[];
}
