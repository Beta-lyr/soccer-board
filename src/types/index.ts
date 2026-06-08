export type PlayerStatus = "healthy" | "minor_injury" | "injured" | "leave";
export type PreferredFoot = "left" | "right" | "both";

export interface PlayerAbilities {
  speed: number;
  shooting: number;
  passing: number;
  defending: number;
  stamina: number;
  awareness: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  height?: number;
  weight?: number;
  preferredFoot: PreferredFoot;
  positions: string[];
  avatar?: string;
  status: PlayerStatus;
  abilities: PlayerAbilities;
  createdAt: string;
  updatedAt: string;
}

export type TacticType = "open_play" | "corner" | "free_kick" | "throw_in";

export interface TacticPlayerPosition {
  playerId: string;
  x: number;
  y: number;
  label?: string;
}

export interface Tactic {
  id: string;
  name: string;
  type: TacticType;
  formation: string;
  players: TacticPlayerPosition[];
  drawings: unknown[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineupStarter {
  playerId: string;
  position: string;
  x: number;
  y: number;
}

export interface LineupTemplate {
  id: string;
  name: string;
  formation: string;
  starters: LineupStarter[];
  substitutes: string[];
  createdAt: string;
  updatedAt: string;
}

export type MatchType = "league" | "friendly" | "training";
export type MatchStatus = "upcoming" | "live" | "finished";
export type MatchEventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "substitution";

export interface MatchEvent {
  id: string;
  matchId: string;
  type: MatchEventType;
  minute: number;
  playerId: string;
  relatedPlayerId?: string;
  note?: string;
  timestamp: string;
}

export interface MatchRating {
  playerId: string;
  score: number;
  note?: string;
}

export interface Match {
  id: string;
  date: string;
  opponent: string;
  venue: string;
  type: MatchType;
  status: MatchStatus;
  lineup: { playerId: string; position: string }[];
  score?: { home: number; away: number };
  events: MatchEvent[];
  ratings: MatchRating[];
  createdAt: string;
  updatedAt: string;
}

export type TrainingTheme = "fitness" | "technical" | "tactical" | "set_piece";

export interface TrainingAttendance {
  playerId: string;
  present: boolean;
  note?: string;
}

export interface Training {
  id: string;
  date: string;
  time: string;
  location: string;
  theme: TrainingTheme;
  description?: string;
  attendance: TrainingAttendance[];
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType = "match" | "training" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  relatedId?: string;
}

export interface FormationPosition {
  position: string;
  x: number;
  y: number;
}

export const FORMATIONS: Record<string, FormationPosition[]> = {
  "4-4-2": [
    { position: "GK", x: 50, y: 90 },
    { position: "LB", x: 15, y: 70 },
    { position: "CB", x: 35, y: 72 },
    { position: "CB", x: 65, y: 72 },
    { position: "RB", x: 85, y: 70 },
    { position: "LM", x: 15, y: 45 },
    { position: "CM", x: 35, y: 48 },
    { position: "CM", x: 65, y: 48 },
    { position: "RM", x: 85, y: 45 },
    { position: "ST", x: 35, y: 20 },
    { position: "ST", x: 65, y: 20 },
  ],
  "4-3-3": [
    { position: "GK", x: 50, y: 90 },
    { position: "LB", x: 15, y: 70 },
    { position: "CB", x: 35, y: 72 },
    { position: "CB", x: 65, y: 72 },
    { position: "RB", x: 85, y: 70 },
    { position: "CM", x: 30, y: 48 },
    { position: "CM", x: 50, y: 45 },
    { position: "CM", x: 70, y: 48 },
    { position: "LW", x: 15, y: 20 },
    { position: "ST", x: 50, y: 18 },
    { position: "RW", x: 85, y: 20 },
  ],
  "3-5-2": [
    { position: "GK", x: 50, y: 90 },
    { position: "CB", x: 25, y: 72 },
    { position: "CB", x: 50, y: 75 },
    { position: "CB", x: 75, y: 72 },
    { position: "LM", x: 10, y: 45 },
    { position: "CM", x: 30, y: 48 },
    { position: "CM", x: 50, y: 45 },
    { position: "CM", x: 70, y: 48 },
    { position: "RM", x: 90, y: 45 },
    { position: "ST", x: 35, y: 20 },
    { position: "ST", x: 65, y: 20 },
  ],
  "4-2-3-1": [
    { position: "GK", x: 50, y: 90 },
    { position: "LB", x: 15, y: 70 },
    { position: "CB", x: 35, y: 72 },
    { position: "CB", x: 65, y: 72 },
    { position: "RB", x: 85, y: 70 },
    { position: "CDM", x: 35, y: 55 },
    { position: "CDM", x: 65, y: 55 },
    { position: "LAM", x: 20, y: 35 },
    { position: "CAM", x: 50, y: 32 },
    { position: "RAM", x: 80, y: 35 },
    { position: "ST", x: 50, y: 15 },
  ],
};

export const FORMATION_LIST = Object.keys(FORMATIONS);
