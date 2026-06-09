import Dexie, { type Table } from "dexie";
import type {
  Player,
  Tactic,
  LineupTemplate,
  Match,
  Training,
} from "@/types";

class SoccerDB extends Dexie {
  players!: Table<Player>;
  tactics!: Table<Tactic>;
  lineupTemplates!: Table<LineupTemplate>;
  matches!: Table<Match>;
  trainings!: Table<Training>;

  constructor() {
    super("soccer-board");
    this.version(1).stores({
      players: "id, name, number, status",
      tactics: "id, name, type, formation",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type",
      trainings: "id, date, theme",
    });
  }
}

export const db = new SoccerDB();
