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
      lineupTemplates: "id, name, formation",
      matches: "id, date, opponent, status, type",
      trainings: "id, date, theme",
    });
    this.version(2).stores({
      players: "id, name, number, status, createdAt",
      tactics: "id, name, type, formation, createdAt",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type, createdAt",
      trainings: "id, date, theme, createdAt",
    });
  }
}

export const db = new SoccerDB();
