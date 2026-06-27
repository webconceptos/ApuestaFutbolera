// Motor de puntuación: funciones puras y deterministas (mismos inputs →
// mismos outputs, sin tocar la base de datos ni el reloj). Ver Paso 18 en
// CLAUDE.md. El cálculo real de puntos por predicción y el recálculo de
// ranking al ingresar un resultado se conectan en el Paso 19.

export type MatchResult = "HOME" | "AWAY" | "DRAW";
export type ResultType = "NONE" | "CORRECT_RESULT" | "CORRECT_DIFF" | "EXACT_SCORE";

export interface ScoreConfig {
  pointsExactScore: number;
  pointsCorrectResult: number;
  pointsCorrectGoalDiff: number;
}

export interface PhaseMultiplierConfig {
  bonusKnockout: number;
  bonusFinal: number;
}

/** HOME si ganó el local, AWAY si ganó el visitante, DRAW si empataron. */
export function getMatchResult(home: number, away: number): MatchResult {
  if (home > away) return "HOME";
  if (away > home) return "AWAY";
  return "DRAW";
}

/**
 * Puntos de UNA predicción contra el resultado real.
 * Jerarquía: marcador exacto > diferencia de gol correcta > solo el ganador/empate > nada.
 * El multiplicador de fase (ver getPhaseMultiplier) se aplica y se redondea
 * al entero más cercano para no dejar puntajes fraccionarios.
 */
export function calculatePoints(
  prediction: { homeScore: number; awayScore: number },
  result: { homeScore: number; awayScore: number },
  config: ScoreConfig,
  phaseMultiplier = 1
): { points: number; resultType: ResultType } {
  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    return { points: Math.round(config.pointsExactScore * phaseMultiplier), resultType: "EXACT_SCORE" };
  }

  const predictedResult = getMatchResult(prediction.homeScore, prediction.awayScore);
  const actualResult = getMatchResult(result.homeScore, result.awayScore);

  if (predictedResult !== actualResult) {
    return { points: 0, resultType: "NONE" };
  }

  const predictedDiff = prediction.homeScore - prediction.awayScore;
  const actualDiff = result.homeScore - result.awayScore;

  if (predictedDiff === actualDiff) {
    return { points: Math.round(config.pointsCorrectGoalDiff * phaseMultiplier), resultType: "CORRECT_DIFF" };
  }

  return { points: Math.round(config.pointsCorrectResult * phaseMultiplier), resultType: "CORRECT_RESULT" };
}

/**
 * `phase` es texto libre (Match.phase), no un enum, así que se detecta por
 * convención: contiene "grupo" → fase de grupos (x1), es "Final" → bonusFinal,
 * cualquier otra cosa (octavos, cuartos, semifinal, tercer lugar...) → bonusKnockout.
 * Coincide con los nombres de fase usados por el seed del Mundial 2026.
 */
export function getPhaseMultiplier(phase: string, config: PhaseMultiplierConfig): number {
  const normalized = phase.trim().toLowerCase();
  if (normalized.includes("grupo")) return 1;
  if (normalized === "final") return config.bonusFinal;
  return config.bonusKnockout;
}

export interface RankingPrediction {
  resultType: ResultType;
  pointsEarned: number;
  homeScore: number;
  awayScore: number;
  matchHomeScore: number | null;
  matchAwayScore: number | null;
}

export interface RankingMember {
  userId: string;
  name: string;
  joinedAt: Date;
  predictions: RankingPrediction[];
}

export interface RankedMember {
  userId: string;
  name: string;
  totalPoints: number;
  exactScores: number;
  position: number;
}

function sumGoalDiff(predictions: RankingPrediction[]): number {
  return predictions.reduce((acc, p) => {
    if (p.matchHomeScore === null || p.matchAwayScore === null) return acc;
    return acc + Math.abs(p.homeScore - p.matchHomeScore) + Math.abs(p.awayScore - p.matchAwayScore);
  }, 0);
}

function sumTotalGoals(predictions: RankingPrediction[]): number {
  return predictions.reduce((acc, p) => acc + p.homeScore + p.awayScore, 0);
}

/**
 * Ordena a los miembros de una polla por puntos totales y resuelve empates
 * según PoolConfig.tiebreakerCriteria (CSV ordenado, ver CLAUDE.md). Siempre
 * devuelve posiciones consecutivas sin huecos, incluso si dos miembros quedan
 * empatados en todos los criterios.
 */
export function calculateRanking(
  members: RankingMember[],
  config: { tiebreakerCriteria: string }
): RankedMember[] {
  const criteria = config.tiebreakerCriteria
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const enriched = members.map((m) => ({
    userId: m.userId,
    name: m.name,
    joinedAt: m.joinedAt,
    totalPoints: m.predictions.reduce((acc, p) => acc + p.pointsEarned, 0),
    exactScores: m.predictions.filter((p) => p.resultType === "EXACT_SCORE").length,
    goalDiff: sumGoalDiff(m.predictions),
    totalGoals: sumTotalGoals(m.predictions),
  }));

  const sorted = [...enriched].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

    for (const criterion of criteria) {
      let cmp = 0;
      if (criterion === "exactScores") cmp = b.exactScores - a.exactScores;
      else if (criterion === "goalDiff") cmp = a.goalDiff - b.goalDiff;
      else if (criterion === "totalGoals") cmp = a.totalGoals - b.totalGoals;
      else if (criterion === "alphabetical") cmp = a.name.localeCompare(b.name);
      else if (criterion === "joinedDate") cmp = a.joinedAt.getTime() - b.joinedAt.getTime();
      if (cmp !== 0) return cmp;
    }
    return 0;
  });

  return sorted.map((m, index) => ({
    userId: m.userId,
    name: m.name,
    totalPoints: m.totalPoints,
    exactScores: m.exactScores,
    position: index + 1,
  }));
}
