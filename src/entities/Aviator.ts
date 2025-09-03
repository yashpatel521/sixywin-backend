import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { AviatorDraw } from "./AviatorDraw";

@Entity()
export class Aviator {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.aviatorBids)
  user: User;

  @ManyToOne(() => AviatorDraw, (draw) => draw.bids, { nullable: true })
  draw: AviatorDraw;

  @Column("int")
  amount: number; // bet amount

  @Column("decimal", { default: 0 })
  cashOutMultiplier: number; // null if didn't cash out

  @Column({
    type: "enum",
    enum: ["win", "loss", "pending"],
    default: "pending",
  })
  outcome: "win" | "loss" | "pending";

  @Column("int", { default: 0 })
  amountWon: number;

  @CreateDateColumn()
  createdAt: Date;
}
