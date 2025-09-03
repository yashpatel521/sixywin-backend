import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";

import { DoubleTroubleDraw } from "./DoubleTroubleDraw";
import { User } from "./User";
import { DrawType } from "../utils/types";

@Entity()
export class DoubleTrouble {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  drawType: DrawType; // Assuming DrawType is an enum or string type

  @Column({ type: "int", default: 0 })
  number: number;

  @Column({ type: "int", default: 0 })
  bidAmount: number;

  @Column()
  status: "win" | "loss" | "jackpot" | "pending";

  // Relation to DoubleTroubleDrawResult
  @ManyToOne(() => DoubleTroubleDraw, (drawResult) => drawResult.bets)
  drawResult: DoubleTroubleDraw;

  // Relation to User
  @ManyToOne(() => User, { eager: false })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
