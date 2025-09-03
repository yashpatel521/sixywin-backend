import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Aviator } from "./Aviator";

@Entity()
export class AviatorDraw {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryGeneratedColumn("uuid")
  roundId: string; // Unique identifier for the round

  @Column("decimal", { nullable: true, precision: 5, scale: 2, default: 1 })
  crashMultiplier: number; // Set at end of round

  @Column({ type: "enum", enum: ["ongoing", "finished"], default: "ongoing" })
  status: "ongoing" | "finished";

  @OneToMany(() => Aviator, (bid) => bid.draw)
  bids: Aviator[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  endedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
