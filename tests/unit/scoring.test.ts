import { describe, it, expect } from "vitest";
import {
  getMatchResult,
  calculatePoints,
  getPhaseMultiplier,
  calculateRanking,
  type RankingMember,
} from "@/lib/scoring";

const SCORE_CONFIG = { pointsExactScore: 5, pointsCorrectResult: 2, pointsCorrectGoalDiff: 3 };
const PHASE_CONFIG = { bonusKnockout: 1.5, bonusFinal: 2.0 };

describe("getMatchResult", () => {
  it("devuelve HOME cuando gana el local", () => {
    expect(getMatchResult(2, 1)).toBe("HOME");
  });

  it("devuelve AWAY cuando gana el visitante", () => {
    expect(getMatchResult(0, 3)).toBe("AWAY");
  });

  it("devuelve DRAW cuando empatan", () => {
    expect(getMatchResult(1, 1)).toBe("DRAW");
  });

  it("trata 0-0 como DRAW", () => {
    expect(getMatchResult(0, 0)).toBe("DRAW");
  });
});

describe("calculatePoints", () => {
  it("otorga pointsExactScore cuando el marcador es idéntico", () => {
    const result = calculatePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 5, resultType: "EXACT_SCORE" });
  });

  it("otorga pointsCorrectGoalDiff cuando la diferencia de gol coincide pero el marcador no", () => {
    // predicción 2-0 (diff +2), resultado 3-1 (diff +2): mismo ganador, misma diferencia
    const result = calculatePoints({ homeScore: 2, awayScore: 0 }, { homeScore: 3, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 3, resultType: "CORRECT_DIFF" });
  });

  it("otorga pointsCorrectResult cuando solo acierta el ganador, no la diferencia", () => {
    // predicción 1-0 (diff +1), resultado 3-1 (diff +2): mismo ganador, distinta diferencia
    const result = calculatePoints({ homeScore: 1, awayScore: 0 }, { homeScore: 3, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 2, resultType: "CORRECT_RESULT" });
  });

  it("no otorga puntos cuando falla el ganador/empate", () => {
    const result = calculatePoints({ homeScore: 2, awayScore: 0 }, { homeScore: 0, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 0, resultType: "NONE" });
  });

  it("no otorga puntos cuando predice empate pero hubo un ganador", () => {
    const result = calculatePoints({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 0, resultType: "NONE" });
  });

  it("no otorga puntos cuando predice un ganador pero hubo empate", () => {
    const result = calculatePoints({ homeScore: 2, awayScore: 1 }, { homeScore: 1, awayScore: 1 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 0, resultType: "NONE" });
  });

  it("premia con CORRECT_DIFF cualquier empate predicho contra un empate real (diferencia siempre 0)", () => {
    const result = calculatePoints({ homeScore: 0, awayScore: 0 }, { homeScore: 3, awayScore: 3 }, SCORE_CONFIG);
    expect(result).toEqual({ points: 3, resultType: "CORRECT_DIFF" });
  });

  it("aplica el multiplicador de fase y redondea", () => {
    const result = calculatePoints(
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1 },
      SCORE_CONFIG,
      1.5
    );
    expect(result).toEqual({ points: 8, resultType: "EXACT_SCORE" }); // 5 * 1.5 = 7.5 -> redondea a 8
  });

  it("usa multiplicador 1 por defecto cuando no se especifica", () => {
    const result = calculatePoints({ homeScore: 1, awayScore: 0 }, { homeScore: 1, awayScore: 0 }, SCORE_CONFIG);
    expect(result.points).toBe(5);
  });
});

describe("getPhaseMultiplier", () => {
  it("no aplica bonus en fase de grupos", () => {
    expect(getPhaseMultiplier("Fase de Grupos - Grupo A", PHASE_CONFIG)).toBe(1);
  });

  it("detecta 'grupo' sin importar mayúsculas/minúsculas", () => {
    expect(getPhaseMultiplier("fase DE grupos - GRUPO l", PHASE_CONFIG)).toBe(1);
  });

  it("aplica bonusFinal en la Final", () => {
    expect(getPhaseMultiplier("Final", PHASE_CONFIG)).toBe(2.0);
  });

  it("trata la Final con espacios extra como Final", () => {
    expect(getPhaseMultiplier("  Final  ", PHASE_CONFIG)).toBe(2.0);
  });

  it("aplica bonusKnockout a octavos, cuartos, semifinal y tercer lugar", () => {
    expect(getPhaseMultiplier("Dieciseisavos de Final", PHASE_CONFIG)).toBe(1.5);
    expect(getPhaseMultiplier("Octavos de Final", PHASE_CONFIG)).toBe(1.5);
    expect(getPhaseMultiplier("Cuartos de Final", PHASE_CONFIG)).toBe(1.5);
    expect(getPhaseMultiplier("Semifinal", PHASE_CONFIG)).toBe(1.5);
    expect(getPhaseMultiplier("Tercer Lugar", PHASE_CONFIG)).toBe(1.5);
  });
});

describe("calculateRanking", () => {
  function member(overrides: Partial<RankingMember>): RankingMember {
    return {
      userId: "u1",
      name: "Jugador",
      joinedAt: new Date("2026-01-01"),
      predictions: [],
      ...overrides,
    };
  }

  it("ordena por puntos totales descendente", () => {
    const members = [
      member({ userId: "a", name: "Ana", predictions: [{ resultType: "EXACT_SCORE", pointsEarned: 5, homeScore: 1, awayScore: 0, matchHomeScore: 1, matchAwayScore: 0 }] }),
      member({ userId: "b", name: "Bruno", predictions: [{ resultType: "CORRECT_RESULT", pointsEarned: 2, homeScore: 1, awayScore: 0, matchHomeScore: 2, matchAwayScore: 1 }] }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "alphabetical" });
    expect(ranking.map((r) => r.userId)).toEqual(["a", "b"]);
    expect(ranking[0]).toMatchObject({ totalPoints: 5, exactScores: 1, position: 1 });
    expect(ranking[1]).toMatchObject({ totalPoints: 2, exactScores: 0, position: 2 });
  });

  it("desempata por exactScores cuando los puntos están empatados", () => {
    const members = [
      member({ userId: "a", predictions: [{ resultType: "CORRECT_DIFF", pointsEarned: 3, homeScore: 2, awayScore: 0, matchHomeScore: 3, matchAwayScore: 1 }] }),
      member({ userId: "b", predictions: [{ resultType: "EXACT_SCORE", pointsEarned: 3, homeScore: 1, awayScore: 0, matchHomeScore: 1, matchAwayScore: 0 }] }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "exactScores" });
    expect(ranking.map((r) => r.userId)).toEqual(["b", "a"]);
  });

  it("desempata por goalDiff (menor diferencia total entre predicción y resultado gana)", () => {
    const members = [
      member({
        userId: "a",
        predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 0, awayScore: 0, matchHomeScore: 3, matchAwayScore: 3 }],
      }),
      member({
        userId: "b",
        predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 2, awayScore: 2, matchHomeScore: 3, matchAwayScore: 3 }],
      }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "goalDiff" });
    // a: |0-3|+|0-3|=6 ; b: |2-3|+|2-3|=2 -> b queda primero
    expect(ranking.map((r) => r.userId)).toEqual(["b", "a"]);
  });

  it("ignora predicciones de partidos sin resultado todavía al calcular goalDiff", () => {
    const members = [
      member({
        userId: "a",
        predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 5, awayScore: 5, matchHomeScore: null, matchAwayScore: null }],
      }),
      member({
        userId: "b",
        predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 0, awayScore: 0, matchHomeScore: null, matchAwayScore: null }],
      }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "goalDiff,alphabetical" });
    // ambos en 0 (sin partidos finalizados) -> desempata por nombre
    expect(ranking.map((r) => r.userId)).toEqual(["a", "b"]);
  });

  it("desempata por totalGoals (predicciones más conservadoras ganan)", () => {
    const members = [
      member({ userId: "a", predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 4, awayScore: 3, matchHomeScore: 0, matchAwayScore: 0 }] }),
      member({ userId: "b", predictions: [{ resultType: "NONE", pointsEarned: 0, homeScore: 1, awayScore: 0, matchHomeScore: 0, matchAwayScore: 0 }] }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "totalGoals" });
    expect(ranking.map((r) => r.userId)).toEqual(["b", "a"]);
  });

  it("desempata alfabéticamente por nombre", () => {
    const members = [member({ userId: "z", name: "Zoe" }), member({ userId: "a", name: "Ana" })];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "alphabetical" });
    expect(ranking.map((r) => r.userId)).toEqual(["a", "z"]);
  });

  it("desempata por fecha de ingreso (quien se unió antes queda primero)", () => {
    const members = [
      member({ userId: "late", joinedAt: new Date("2026-02-01") }),
      member({ userId: "early", joinedAt: new Date("2026-01-01") }),
    ];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "joinedDate" });
    expect(ranking.map((r) => r.userId)).toEqual(["early", "late"]);
  });

  it("encadena varios criterios: usa el segundo cuando el primero no resuelve el empate", () => {
    const members = [
      member({ userId: "z", name: "Zoe" }),
      member({ userId: "a", name: "Ana" }),
    ];
    // ninguno tiene exactScores (ambos 0) -> pasa a alphabetical
    const ranking = calculateRanking(members, { tiebreakerCriteria: "exactScores,alphabetical" });
    expect(ranking.map((r) => r.userId)).toEqual(["a", "z"]);
  });

  it("asigna posiciones consecutivas sin huecos incluso si el empate no se resuelve", () => {
    const members = [member({ userId: "a", name: "Misma" }), member({ userId: "b", name: "Misma" })];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "alphabetical" });
    expect(ranking.map((r) => r.position)).toEqual([1, 2]);
  });

  it("ignora criterios vacíos o con espacios extra en el CSV", () => {
    const members = [member({ userId: "z", name: "Zoe" }), member({ userId: "a", name: "Ana" })];
    const ranking = calculateRanking(members, { tiebreakerCriteria: " alphabetical ,, " });
    expect(ranking.map((r) => r.userId)).toEqual(["a", "z"]);
  });

  it("devuelve lista vacía cuando no hay miembros", () => {
    expect(calculateRanking([], { tiebreakerCriteria: "alphabetical" })).toEqual([]);
  });

  it("ignora un criterio desconocido en el CSV y sigue con el siguiente", () => {
    const members = [member({ userId: "z", name: "Zoe" }), member({ userId: "a", name: "Ana" })];
    const ranking = calculateRanking(members, { tiebreakerCriteria: "criterioInventado,alphabetical" });
    expect(ranking.map((r) => r.userId)).toEqual(["a", "z"]);
  });
});
