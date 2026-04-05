export interface GameChoice {
  id: string;
  label: string;
  description: string;
}

export interface PlayerPassport {
  location: string;
  miles_to_nyc: number;
  cash: number;
  heat: number;
  inventory: string[];
  distraction_score: number;
  times_deceived: number;
  turn: number;
  choices_history: string[];
  sessionId?: string;
}

export interface GhostPost {
  user: string;
  message: string;
}

export interface TurnResponse {
  narrative: string;
  choices: GameChoice[];
  ghost_post?: GhostPost;
  game_state_update: Partial<PlayerPassport>;
  game_over: boolean;
  game_over_reason: string | null;
  victory: boolean;
}

export function createInitialGameState(sessionId: string): PlayerPassport {
  return {
    location: "Los Angeles, CA",
    miles_to_nyc: 2800,
    cash: 1200,
    heat: 0,
    inventory: [],
    distraction_score: 0,
    times_deceived: 0,
    turn: 0,
    choices_history: [],
    sessionId,
  };
}
