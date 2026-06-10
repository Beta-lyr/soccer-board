import Dexie, { type Table } from "dexie";
import type {
  Player,
  Tactic,
  LineupTemplate,
  Match,
  Training,
  Competition,
  Team,
} from "@/types";

export interface MatchTimerState {
  matchId: string;
  startedAt: number;
  pausedElapsed: number;
  isRunning: boolean;
}

class SoccerDB extends Dexie {
  players!: Table<Player>;
  tactics!: Table<Tactic>;
  lineupTemplates!: Table<LineupTemplate>;
  matches!: Table<Match>;
  trainings!: Table<Training>;
  matchTimers!: Table<MatchTimerState>;
  competitions!: Table<Competition>;
  teams!: Table<Team>;

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
    this.version(3).stores({
      players: "id, name, number, status, createdAt",
      tactics: "id, name, type, formation, createdAt",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type, createdAt",
      trainings: "id, date, theme, createdAt",
      matchTimers: "matchId",
    });
    this.version(4).stores({
      players: "id, name, number, status, createdAt",
      tactics: "id, name, type, formation, createdAt",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type, createdAt",
      trainings: "id, date, theme, createdAt",
      matchTimers: "matchId",
      competitions: "id, name, type, createdAt",
    });
    this.version(5).stores({
      players: "id, name, number, status, createdAt",
      tactics: "id, name, type, formation, createdAt",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type, scope, competitionId, createdAt",
      trainings: "id, date, theme, createdAt",
      matchTimers: "matchId",
      competitions: "id, name, type, createdAt",
      teams: "id, name, createdAt",
    });
  }
}

export const db = new SoccerDB();
