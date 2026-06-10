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
  drawings: unknown[]; // Drawing[] 新格式 | fabric JSON 旧格式
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
export type MatchEventType = "goal" | "assist" | "yellow_card" | "red_card" | "substitution";

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
    { position: "GK", x: 50, y: 92 },
    { position: "LB", x: 15, y: 72 },
    { position: "CB", x: 35, y: 75 },
    { position: "CB", x: 65, y: 75 },
    { position: "RB", x: 85, y: 72 },
    { position: "LM", x: 15, y: 48 },
    { position: "CM", x: 38, y: 50 },
    { position: "CM", x: 62, y: 50 },
    { position: "RM", x: 85, y: 48 },
    { position: "ST", x: 38, y: 22 },
    { position: "ST", x: 62, y: 22 },
  ],
  "4-3-3": [
    { position: "GK", x: 50, y: 92 },
    { position: "LB", x: 15, y: 72 },
    { position: "CB", x: 35, y: 75 },
    { position: "CB", x: 65, y: 75 },
    { position: "RB", x: 85, y: 72 },
    { position: "CM", x: 30, y: 50 },
    { position: "CM", x: 50, y: 46 },
    { position: "CM", x: 70, y: 50 },
    { position: "LW", x: 15, y: 22 },
    { position: "ST", x: 50, y: 18 },
    { position: "RW", x: 85, y: 22 },
  ],
  "3-5-2": [
    { position: "GK", x: 50, y: 92 },
    { position: "CB", x: 25, y: 75 },
    { position: "CB", x: 50, y: 78 },
    { position: "CB", x: 75, y: 75 },
    { position: "LM", x: 10, y: 48 },
    { position: "CM", x: 30, y: 50 },
    { position: "CM", x: 50, y: 46 },
    { position: "CM", x: 70, y: 50 },
    { position: "RM", x: 90, y: 48 },
    { position: "ST", x: 38, y: 22 },
    { position: "ST", x: 62, y: 22 },
  ],
  "4-2-3-1": [
    { position: "GK", x: 50, y: 92 },
    { position: "LB", x: 15, y: 72 },
    { position: "CB", x: 35, y: 75 },
    { position: "CB", x: 65, y: 75 },
    { position: "RB", x: 85, y: 72 },
    { position: "CDM", x: 38, y: 58 },
    { position: "CDM", x: 62, y: 58 },
    { position: "LAM", x: 22, y: 38 },
    { position: "CAM", x: 50, y: 35 },
    { position: "RAM", x: 78, y: 38 },
    { position: "ST", x: 50, y: 18 },
  ],
  "4-5-1": [
    { position: "GK", x: 50, y: 92 },
    { position: "LB", x: 15, y: 72 },
    { position: "CB", x: 35, y: 75 },
    { position: "CB", x: 65, y: 75 },
    { position: "RB", x: 85, y: 72 },
    { position: "LM", x: 12, y: 45 },
    { position: "CM", x: 30, y: 48 },
    { position: "CM", x: 50, y: 44 },
    { position: "CM", x: 70, y: 48 },
    { position: "RM", x: 88, y: 45 },
    { position: "ST", x: 50, y: 20 },
  ],
  "3-4-3": [
    { position: "GK", x: 50, y: 92 },
    { position: "CB", x: 25, y: 75 },
    { position: "CB", x: 50, y: 78 },
    { position: "CB", x: 75, y: 75 },
    { position: "LM", x: 12, y: 50 },
    { position: "CM", x: 38, y: 52 },
    { position: "CM", x: 62, y: 52 },
    { position: "RM", x: 88, y: 50 },
    { position: "LW", x: 18, y: 22 },
    { position: "ST", x: 50, y: 18 },
    { position: "RW", x: 82, y: 22 },
  ],
  "5-3-2": [
    { position: "GK", x: 50, y: 92 },
    { position: "LWB", x: 10, y: 62 },
    { position: "CB", x: 28, y: 75 },
    { position: "CB", x: 50, y: 78 },
    { position: "CB", x: 72, y: 75 },
    { position: "RWB", x: 90, y: 62 },
    { position: "CM", x: 32, y: 48 },
    { position: "CM", x: 50, y: 44 },
    { position: "CM", x: 68, y: 48 },
    { position: "ST", x: 38, y: 22 },
    { position: "ST", x: 62, y: 22 },
  ],
  "4-1-4-1": [
    { position: "GK", x: 50, y: 92 },
    { position: "LB", x: 15, y: 72 },
    { position: "CB", x: 35, y: 75 },
    { position: "CB", x: 65, y: 75 },
    { position: "RB", x: 85, y: 72 },
    { position: "CDM", x: 50, y: 58 },
    { position: "LM", x: 15, y: 40 },
    { position: "CM", x: 38, y: 42 },
    { position: "CM", x: 62, y: 42 },
    { position: "RM", x: 85, y: 40 },
    { position: "ST", x: 50, y: 18 },
  ],
};

export const FORMATION_LIST = Object.keys(FORMATIONS);
