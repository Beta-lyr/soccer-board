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

// ============ 队伍 ============

export interface Team {
  id: string;
  name: string;           // 队伍名（如"计算机学院"）
  shortName?: string;     // 简称（如"计算机"）
  logo?: string;          // logo key（R2）
  playerIds: string[];    // 关联的球员ID列表
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

export type MatchType = "league" | "friendly" | "training" | "cup";
export type MatchStatus = "upcoming" | "live" | "finished";
export type MatchEventType = "goal" | "assist" | "yellow_card" | "red_card" | "substitution";
export type MatchScope = "internal" | "external"; // 校内 | 校外

// ============ 赛事（杯赛/联赛） ============

export type CompetitionType = "league" | "cup";
export type CompetitionFormat = "round_robin" | "knockout";

export interface Standing {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  format: CompetitionFormat;
  teams: string[];
  matchIds: string[];
  standings?: Standing[];
  currentRound: number;        // 杯赛当前轮次
  createdAt: string;
  updatedAt: string;
}

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

/** 比赛阵容条目（支持对方球员用名字） */
export interface MatchLineupEntry {
  playerId?: string;      // 本队球员（有ID）
  playerName?: string;    // 对方球员（只有名字，校内比赛用）
  position: string;
}

export interface Match {
  id: string;
  date: string;
  venue: string;
  type: MatchType;
  scope: MatchScope;          // 校内 | 校外
  status: MatchStatus;

  homeTeam: string;           // 主队名（校内=院系名，校外="我方"）
  awayTeam: string;           // 客队名（校内=另一个院系，校外=对手队名）
  opponent: string;           // 兼容旧数据 = awayTeam

  homeLineup: MatchLineupEntry[];  // 主队阵容
  awayLineup: MatchLineupEntry[];  // 客队阵容（校外比赛为空）
  lineup: { playerId: string; position: string }[];  // 兼容旧数据 = homeLineup

  score?: { home: number; away: number };
  events: MatchEvent[];
  ratings: MatchRating[];
  competitionId?: string;     // 所属赛事
  round?: number;             // 轮次

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

/** 阵型按人数分组 */
export const FORMATION_GROUPS: Record<number, Record<string, FormationPosition[]>> = {
  5: {
    "2-1-1": [
      { position: "GK", x: 50, y: 90 },
      { position: "DF", x: 25, y: 60 },
      { position: "DF", x: 75, y: 60 },
      { position: "MF", x: 50, y: 35 },
      { position: "FW", x: 50, y: 12 },
    ],
    "1-2-1": [
      { position: "GK", x: 50, y: 90 },
      { position: "DF", x: 50, y: 60 },
      { position: "MF", x: 25, y: 35 },
      { position: "MF", x: 75, y: 35 },
      { position: "FW", x: 50, y: 12 },
    ],
  },
  7: {
    "2-3-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 30, y: 68 },
      { position: "DF", x: 70, y: 68 },
      { position: "MF", x: 18, y: 40 },
      { position: "MF", x: 50, y: 40 },
      { position: "MF", x: 82, y: 40 },
      { position: "FW", x: 50, y: 15 },
    ],
    "3-2-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 18, y: 72 },
      { position: "DF", x: 50, y: 68 },
      { position: "DF", x: 82, y: 72 },
      { position: "MF", x: 32, y: 40 },
      { position: "MF", x: 68, y: 40 },
      { position: "FW", x: 50, y: 15 },
    ],
    "2-2-2": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 30, y: 68 },
      { position: "DF", x: 70, y: 68 },
      { position: "MF", x: 30, y: 38 },
      { position: "MF", x: 70, y: 38 },
      { position: "FW", x: 35, y: 15 },
      { position: "FW", x: 65, y: 15 },
    ],
  },
  8: {
    "3-3-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 18, y: 72 },
      { position: "DF", x: 50, y: 68 },
      { position: "DF", x: 82, y: 72 },
      { position: "MF", x: 18, y: 42 },
      { position: "MF", x: 50, y: 38 },
      { position: "MF", x: 82, y: 42 },
      { position: "FW", x: 50, y: 15 },
    ],
    "3-2-2": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 18, y: 72 },
      { position: "DF", x: 50, y: 68 },
      { position: "DF", x: 82, y: 72 },
      { position: "MF", x: 32, y: 40 },
      { position: "MF", x: 68, y: 40 },
      { position: "FW", x: 35, y: 15 },
      { position: "FW", x: 65, y: 15 },
    ],
    "4-2-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 12, y: 72 },
      { position: "DF", x: 36, y: 68 },
      { position: "DF", x: 64, y: 68 },
      { position: "DF", x: 88, y: 72 },
      { position: "MF", x: 32, y: 38 },
      { position: "MF", x: 68, y: 38 },
      { position: "FW", x: 50, y: 15 },
    ],
    "2-3-2": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 30, y: 70 },
      { position: "DF", x: 70, y: 70 },
      { position: "MF", x: 18, y: 42 },
      { position: "MF", x: 50, y: 38 },
      { position: "MF", x: 82, y: 42 },
      { position: "FW", x: 35, y: 15 },
      { position: "FW", x: 65, y: 15 },
    ],
  },
  9: {
    "3-3-2": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 18, y: 72 },
      { position: "DF", x: 50, y: 68 },
      { position: "DF", x: 82, y: 72 },
      { position: "MF", x: 18, y: 42 },
      { position: "MF", x: 50, y: 38 },
      { position: "MF", x: 82, y: 42 },
      { position: "FW", x: 35, y: 15 },
      { position: "FW", x: 65, y: 15 },
    ],
    "4-3-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 12, y: 72 },
      { position: "DF", x: 36, y: 68 },
      { position: "DF", x: 64, y: 68 },
      { position: "DF", x: 88, y: 72 },
      { position: "MF", x: 22, y: 40 },
      { position: "MF", x: 50, y: 36 },
      { position: "MF", x: 78, y: 40 },
      { position: "FW", x: 50, y: 15 },
    ],
    "3-4-1": [
      { position: "GK", x: 50, y: 92 },
      { position: "DF", x: 18, y: 72 },
      { position: "DF", x: 50, y: 68 },
      { position: "DF", x: 82, y: 72 },
      { position: "MF", x: 12, y: 44 },
      { position: "MF", x: 36, y: 40 },
      { position: "MF", x: 64, y: 40 },
      { position: "MF", x: 88, y: 44 },
      { position: "FW", x: 50, y: 15 },
    ],
  },
  11: {
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
  },
};

/** 所有阵型（合并后） */
const _flatFormations: Record<string, FormationPosition[]> = {};
for (const countStr of Object.keys(FORMATION_GROUPS)) {
  const count = Number(countStr);
  const group = FORMATION_GROUPS[count];
  for (const [name, positions] of Object.entries(group)) {
    _flatFormations[name] = positions;
  }
}
// 还原自定义阵型
if (typeof window !== "undefined") {
  try {
    const customs = JSON.parse(localStorage.getItem("customFormations") || "{}");
    for (const [key, value] of Object.entries(customs)) {
      _flatFormations[key] = value as FormationPosition[];
    }
  } catch { /* ignore */ }
}

export const FORMATIONS: Record<string, FormationPosition[]> = _flatFormations;

export const FORMATION_LIST = Object.keys(FORMATIONS);

/** 获取指定人数的阵型名列表 */
export function getFormationsForPlayerCount(count: number): string[] {
  const group = FORMATION_GROUPS[count];
  if (!group) return [];
  const names = Object.keys(group);
  // 追加匹配人数的自定义阵型
  try {
    if (typeof window === "undefined") return names;
    const customs = JSON.parse(localStorage.getItem("customFormations") || "{}");
    for (const [key, positions] of Object.entries(customs)) {
      if ((positions as FormationPosition[]).length === count) {
        names.push(key);
      }
    }
  } catch { /* ignore */ }
  return names;
}

/** 可选的比赛人数 */
export const PLAYER_COUNTS = [5, 7, 8, 9, 11] as const;
