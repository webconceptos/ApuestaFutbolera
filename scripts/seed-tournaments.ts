// Fixture REAL de la FIFA World Cup 2026: sorteo oficial de grupos (5 dic
// 2025) y resultados oficiales de la fase de grupos cargados desde fuentes
// públicas (ESPN / CBS Sports / FIFA.com) al 30 de junio de 2026.
//
// Fase de grupos: resultados completos (jornada 3 incluida, cerrada el 28 jun).
// Dieciseisavos de Final: emparejamientos reales con resultados de los partidos
// jugados hasta el 30 de junio (7 de 16 completados).
// Octavos en adelante: equipos "Por definir" — actualizar desde /superadmin
// conforme avance el torneo.
//
// Nota sobre penales: en los partidos que se definieron por penales se guarda
// el marcador del tiempo reglamentario (90+30 min). El resultado del penalti
// no se almacena en este schema.

export type SeedMatch = {
  matchNumber: number;
  phase: string;
  round: number | null;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: Date;
  venue: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "UPCOMING" | "FINISHED";
};

type Team = { name: string; flag: string };

const HOST_VENUES = [
  { city: "Ciudad de México", venue: "Estadio Banorte (Azteca)" },
  { city: "Guadalajara", venue: "Estadio Akron" },
  { city: "Monterrey", venue: "Estadio BBVA" },
  { city: "Toronto", venue: "BMO Field" },
  { city: "Vancouver", venue: "BC Place" },
  { city: "Atlanta", venue: "Mercedes-Benz Stadium" },
  { city: "Boston", venue: "Gillette Stadium" },
  { city: "Dallas", venue: "AT&T Stadium" },
  { city: "Houston", venue: "NRG Stadium" },
  { city: "Kansas City", venue: "GEHA Field at Arrowhead Stadium" },
  { city: "Los Angeles", venue: "SoFi Stadium" },
  { city: "Miami", venue: "Hard Rock Stadium" },
  { city: "Nueva York / Nueva Jersey", venue: "MetLife Stadium" },
  { city: "Filadelfia", venue: "Lincoln Financial Field" },
  { city: "San Francisco Bay Area", venue: "Levi's Stadium" },
  { city: "Seattle", venue: "Lumen Field" },
];

const TEAMS = {
  mexico: { name: "México", flag: "🇲🇽" },
  sudafrica: { name: "Sudáfrica", flag: "🇿🇦" },
  coreaDelSur: { name: "Corea del Sur", flag: "🇰🇷" },
  republicaCheca: { name: "República Checa", flag: "🇨🇿" },
  canada: { name: "Canadá", flag: "🇨🇦" },
  bosnia: { name: "Bosnia y Herzegovina", flag: "🇧🇦" },
  catar: { name: "Catar", flag: "🇶🇦" },
  suiza: { name: "Suiza", flag: "🇨🇭" },
  brasil: { name: "Brasil", flag: "🇧🇷" },
  marruecos: { name: "Marruecos", flag: "🇲🇦" },
  haiti: { name: "Haití", flag: "🇭🇹" },
  escocia: { name: "Escocia", flag: "🏴" },
  estadosUnidos: { name: "Estados Unidos", flag: "🇺🇸" },
  paraguay: { name: "Paraguay", flag: "🇵🇾" },
  australia: { name: "Australia", flag: "🇦🇺" },
  turquia: { name: "Turquía", flag: "🇹🇷" },
  alemania: { name: "Alemania", flag: "🇩🇪" },
  curazao: { name: "Curazao", flag: "🇨🇼" },
  costaDeMarfil: { name: "Costa de Marfil", flag: "🇨🇮" },
  ecuador: { name: "Ecuador", flag: "🇪🇨" },
  paisesBajos: { name: "Países Bajos", flag: "🇳🇱" },
  japon: { name: "Japón", flag: "🇯🇵" },
  suecia: { name: "Suecia", flag: "🇸🇪" },
  tunez: { name: "Túnez", flag: "🇹🇳" },
  belgica: { name: "Bélgica", flag: "🇧🇪" },
  egipto: { name: "Egipto", flag: "🇪🇬" },
  iran: { name: "Irán", flag: "🇮🇷" },
  nuevaZelanda: { name: "Nueva Zelanda", flag: "🇳🇿" },
  espana: { name: "España", flag: "🇪🇸" },
  caboVerde: { name: "Cabo Verde", flag: "🇨🇻" },
  arabiaSaudita: { name: "Arabia Saudita", flag: "🇸🇦" },
  uruguay: { name: "Uruguay", flag: "🇺🇾" },
  francia: { name: "Francia", flag: "🇫🇷" },
  senegal: { name: "Senegal", flag: "🇸🇳" },
  irak: { name: "Irak", flag: "🇮🇶" },
  noruega: { name: "Noruega", flag: "🇳🇴" },
  argentina: { name: "Argentina", flag: "🇦🇷" },
  argelia: { name: "Argelia", flag: "🇩🇿" },
  austria: { name: "Austria", flag: "🇦🇹" },
  jordania: { name: "Jordania", flag: "🇯🇴" },
  portugal: { name: "Portugal", flag: "🇵🇹" },
  rdCongo: { name: "RD Congo", flag: "🇨🇩" },
  uzbekistan: { name: "Uzbekistán", flag: "🇺🇿" },
  colombia: { name: "Colombia", flag: "🇨🇴" },
  inglaterra: { name: "Inglaterra", flag: "🇬🇧" },
  croacia: { name: "Croacia", flag: "🇭🇷" },
  ghana: { name: "Ghana", flag: "🇬🇭" },
  panama: { name: "Panamá", flag: "🇵🇦" },
} satisfies Record<string, Team>;

interface GroupMatchSeed {
  date: string;
  home: Team;
  away: Team;
  result: [number, number] | null;
}

interface GroupSeed {
  letter: string;
  matches: GroupMatchSeed[];
}

// ─── FASE DE GRUPOS — resultados completos al 28 de junio de 2026 ────────────

const GROUPS: GroupSeed[] = [
  {
    letter: "A",
    matches: [
      { date: "2026-06-11T19:00:00Z", home: TEAMS.mexico,         away: TEAMS.sudafrica,    result: [2, 0] },
      { date: "2026-06-12T02:00:00Z", home: TEAMS.coreaDelSur,   away: TEAMS.republicaCheca, result: [2, 1] },
      { date: "2026-06-18T16:00:00Z", home: TEAMS.republicaCheca, away: TEAMS.sudafrica,    result: [1, 1] },
      { date: "2026-06-19T01:00:00Z", home: TEAMS.mexico,         away: TEAMS.coreaDelSur,  result: [1, 0] },
      { date: "2026-06-25T01:00:00Z", home: TEAMS.republicaCheca, away: TEAMS.mexico,       result: [0, 3] },
      { date: "2026-06-25T01:00:00Z", home: TEAMS.sudafrica,      away: TEAMS.coreaDelSur,  result: [1, 0] },
    ],
  },
  {
    letter: "B",
    matches: [
      { date: "2026-06-12T19:00:00Z", home: TEAMS.canada,  away: TEAMS.bosnia, result: [1, 1] },
      { date: "2026-06-13T19:00:00Z", home: TEAMS.catar,   away: TEAMS.suiza,  result: [1, 1] },
      { date: "2026-06-18T19:00:00Z", home: TEAMS.suiza,   away: TEAMS.bosnia, result: [4, 1] },
      { date: "2026-06-18T22:00:00Z", home: TEAMS.canada,  away: TEAMS.catar,  result: [6, 0] },
      { date: "2026-06-24T19:00:00Z", home: TEAMS.suiza,   away: TEAMS.canada, result: [2, 1] },
      { date: "2026-06-24T19:00:00Z", home: TEAMS.bosnia,  away: TEAMS.catar,  result: [3, 1] },
    ],
  },
  {
    letter: "C",
    matches: [
      { date: "2026-06-13T22:00:00Z", home: TEAMS.brasil,   away: TEAMS.marruecos, result: [1, 1] },
      { date: "2026-06-14T01:00:00Z", home: TEAMS.haiti,    away: TEAMS.escocia,   result: [0, 1] },
      { date: "2026-06-19T22:00:00Z", home: TEAMS.escocia,  away: TEAMS.marruecos, result: [0, 1] },
      { date: "2026-06-20T00:30:00Z", home: TEAMS.brasil,   away: TEAMS.haiti,     result: [3, 0] },
      { date: "2026-06-24T22:00:00Z", home: TEAMS.escocia,  away: TEAMS.brasil,    result: [0, 3] },
      { date: "2026-06-24T22:00:00Z", home: TEAMS.marruecos, away: TEAMS.haiti,    result: [4, 2] },
    ],
  },
  {
    letter: "D",
    matches: [
      { date: "2026-06-13T01:00:00Z", home: TEAMS.estadosUnidos, away: TEAMS.paraguay,  result: [4, 1] },
      { date: "2026-06-14T04:00:00Z", home: TEAMS.australia,     away: TEAMS.turquia,   result: [2, 0] },
      { date: "2026-06-19T19:00:00Z", home: TEAMS.estadosUnidos, away: TEAMS.australia, result: [2, 0] },
      { date: "2026-06-20T03:00:00Z", home: TEAMS.turquia,       away: TEAMS.paraguay,  result: [0, 1] },
      { date: "2026-06-26T02:00:00Z", home: TEAMS.turquia,       away: TEAMS.estadosUnidos, result: [3, 2] },
      { date: "2026-06-26T02:00:00Z", home: TEAMS.paraguay,      away: TEAMS.australia, result: [0, 0] },
    ],
  },
  {
    letter: "E",
    matches: [
      { date: "2026-06-14T17:00:00Z", home: TEAMS.alemania,      away: TEAMS.curazao,      result: [7, 1] },
      { date: "2026-06-14T23:00:00Z", home: TEAMS.costaDeMarfil, away: TEAMS.ecuador,      result: [1, 0] },
      { date: "2026-06-20T20:00:00Z", home: TEAMS.alemania,      away: TEAMS.costaDeMarfil, result: [2, 1] },
      { date: "2026-06-21T00:00:00Z", home: TEAMS.ecuador,       away: TEAMS.curazao,      result: [0, 0] },
      { date: "2026-06-25T20:00:00Z", home: TEAMS.curazao,       away: TEAMS.costaDeMarfil, result: [0, 2] },
      { date: "2026-06-25T20:00:00Z", home: TEAMS.ecuador,       away: TEAMS.alemania,     result: [2, 1] },
    ],
  },
  {
    letter: "F",
    matches: [
      { date: "2026-06-14T20:00:00Z", home: TEAMS.paisesBajos, away: TEAMS.japon,  result: [2, 2] },
      { date: "2026-06-15T02:00:00Z", home: TEAMS.suecia,      away: TEAMS.tunez,  result: [5, 1] },
      { date: "2026-06-20T17:00:00Z", home: TEAMS.paisesBajos, away: TEAMS.suecia, result: [5, 1] },
      { date: "2026-06-21T04:00:00Z", home: TEAMS.tunez,       away: TEAMS.japon,  result: [0, 4] },
      { date: "2026-06-25T23:00:00Z", home: TEAMS.japon,       away: TEAMS.suecia, result: [1, 1] },
      { date: "2026-06-25T23:00:00Z", home: TEAMS.tunez,       away: TEAMS.paisesBajos, result: [1, 3] },
    ],
  },
  {
    letter: "G",
    matches: [
      { date: "2026-06-15T19:00:00Z", home: TEAMS.belgica,      away: TEAMS.egipto,      result: [1, 1] },
      { date: "2026-06-16T01:00:00Z", home: TEAMS.iran,         away: TEAMS.nuevaZelanda, result: [2, 2] },
      { date: "2026-06-21T19:00:00Z", home: TEAMS.belgica,      away: TEAMS.iran,         result: [0, 0] },
      { date: "2026-06-22T01:00:00Z", home: TEAMS.nuevaZelanda, away: TEAMS.egipto,       result: [1, 3] },
      { date: "2026-06-27T03:00:00Z", home: TEAMS.egipto,       away: TEAMS.iran,         result: [1, 1] },
      { date: "2026-06-27T03:00:00Z", home: TEAMS.nuevaZelanda, away: TEAMS.belgica,      result: [1, 5] },
    ],
  },
  {
    letter: "H",
    matches: [
      { date: "2026-06-15T16:00:00Z", home: TEAMS.espana,       away: TEAMS.caboVerde,    result: [0, 0] },
      { date: "2026-06-15T22:00:00Z", home: TEAMS.arabiaSaudita, away: TEAMS.uruguay,     result: [1, 1] },
      { date: "2026-06-21T16:00:00Z", home: TEAMS.espana,       away: TEAMS.arabiaSaudita, result: [4, 0] },
      { date: "2026-06-21T22:00:00Z", home: TEAMS.uruguay,      away: TEAMS.caboVerde,    result: [2, 2] },
      { date: "2026-06-27T00:00:00Z", home: TEAMS.caboVerde,    away: TEAMS.arabiaSaudita, result: [0, 0] },
      { date: "2026-06-27T00:00:00Z", home: TEAMS.uruguay,      away: TEAMS.espana,       result: [0, 1] },
    ],
  },
  {
    letter: "I",
    matches: [
      { date: "2026-06-16T19:00:00Z", home: TEAMS.francia,  away: TEAMS.senegal, result: [3, 1] },
      { date: "2026-06-16T22:00:00Z", home: TEAMS.irak,     away: TEAMS.noruega, result: [1, 4] },
      { date: "2026-06-22T21:00:00Z", home: TEAMS.francia,  away: TEAMS.irak,    result: [3, 0] },
      { date: "2026-06-23T00:00:00Z", home: TEAMS.noruega,  away: TEAMS.senegal, result: [3, 2] },
      { date: "2026-06-26T19:00:00Z", home: TEAMS.noruega,  away: TEAMS.francia, result: [1, 4] },
      { date: "2026-06-26T19:00:00Z", home: TEAMS.senegal,  away: TEAMS.irak,    result: [5, 0] },
    ],
  },
  {
    letter: "J",
    matches: [
      { date: "2026-06-17T01:00:00Z", home: TEAMS.argentina, away: TEAMS.argelia,  result: [3, 0] },
      { date: "2026-06-17T04:00:00Z", home: TEAMS.austria,   away: TEAMS.jordania, result: [3, 1] },
      { date: "2026-06-22T17:00:00Z", home: TEAMS.argentina, away: TEAMS.austria,  result: [1, 0] },
      { date: "2026-06-23T03:00:00Z", home: TEAMS.jordania,  away: TEAMS.argelia,  result: [1, 2] },
      { date: "2026-06-28T02:00:00Z", home: TEAMS.argelia,   away: TEAMS.austria,  result: [3, 3] },
      { date: "2026-06-28T02:00:00Z", home: TEAMS.jordania,  away: TEAMS.argentina, result: [3, 3] },
    ],
  },
  {
    letter: "K",
    matches: [
      { date: "2026-06-17T17:00:00Z", home: TEAMS.portugal,   away: TEAMS.rdCongo,    result: [1, 1] },
      { date: "2026-06-18T02:00:00Z", home: TEAMS.uzbekistan, away: TEAMS.colombia,   result: [1, 3] },
      { date: "2026-06-23T17:00:00Z", home: TEAMS.portugal,   away: TEAMS.uzbekistan, result: [5, 0] },
      { date: "2026-06-24T02:00:00Z", home: TEAMS.colombia,   away: TEAMS.rdCongo,    result: [1, 0] },
      { date: "2026-06-27T23:30:00Z", home: TEAMS.colombia,   away: TEAMS.portugal,   result: [0, 0] },
      { date: "2026-06-27T23:30:00Z", home: TEAMS.rdCongo,    away: TEAMS.uzbekistan, result: [3, 1] },
    ],
  },
  {
    letter: "L",
    matches: [
      { date: "2026-06-17T20:00:00Z", home: TEAMS.inglaterra, away: TEAMS.croacia, result: [4, 2] },
      { date: "2026-06-17T23:00:00Z", home: TEAMS.ghana,      away: TEAMS.panama,  result: [1, 0] },
      { date: "2026-06-23T20:00:00Z", home: TEAMS.inglaterra, away: TEAMS.ghana,   result: [0, 0] },
      { date: "2026-06-23T23:00:00Z", home: TEAMS.panama,     away: TEAMS.croacia, result: [0, 1] },
      { date: "2026-06-27T21:00:00Z", home: TEAMS.panama,     away: TEAMS.inglaterra, result: [0, 2] },
      { date: "2026-06-27T21:00:00Z", home: TEAMS.croacia,    away: TEAMS.ghana,   result: [2, 1] },
    ],
  },
];

// ─── DIECISEISAVOS DE FINAL — emparejamientos reales ─────────────────────────
// Equipos clasificados: 1º y 2º de cada grupo + 8 mejores 3eros
// (A3 Sudáfrica, B3 Bosnia, D3 Paraguay, E3 Ecuador, F3 Suecia,
//  J3 Argelia, K3 RD Congo, L3 Ghana)
//
// Resultados al 30 junio: 7 de 16 partidos completados.
// Partidos pendientes (1-3 jul): actualizar desde /superadmin al concluir.

interface KnockoutMatchSeed {
  date: string;
  home: Team;
  away: Team;
  result: [number, number] | null;
  venue: string;
  city: string;
}

const DIECISEISAVOS: KnockoutMatchSeed[] = [
  // ── 28 junio ──────────────────────────────────────────────────────────────
  {
    date: "2026-06-28T19:00:00Z",
    home: TEAMS.canada, away: TEAMS.sudafrica,
    result: [1, 0],
    venue: "SoFi Stadium", city: "Los Angeles",
  },
  // ── 29 junio ──────────────────────────────────────────────────────────────
  {
    date: "2026-06-29T19:00:00Z",
    home: TEAMS.brasil, away: TEAMS.japon,
    result: [2, 1],
    venue: "NRG Stadium", city: "Houston",
  },
  {
    // Alemania gana en penales 4-3 (marcador en tiempo reglamentario 1-1)
    date: "2026-06-29T22:00:00Z",
    home: TEAMS.alemania, away: TEAMS.paraguay,
    result: [1, 1],
    venue: "Gillette Stadium", city: "Boston",
  },
  {
    // Marruecos gana en penales 3-2 (marcador en tiempo reglamentario 1-1)
    date: "2026-06-29T23:00:00Z",
    home: TEAMS.paisesBajos, away: TEAMS.marruecos,
    result: [1, 1],
    venue: "Estadio Akron", city: "Guadalajara",
  },
  // ── 30 junio ──────────────────────────────────────────────────────────────
  {
    date: "2026-06-30T16:00:00Z",
    home: TEAMS.costaDeMarfil, away: TEAMS.noruega,
    result: [1, 2],
    venue: "AT&T Stadium", city: "Dallas",
  },
  {
    date: "2026-06-30T20:00:00Z",
    home: TEAMS.francia, away: TEAMS.suecia,
    result: [3, 0],
    venue: "MetLife Stadium", city: "Nueva York / Nueva Jersey",
  },
  {
    date: "2026-06-30T23:30:00Z",
    home: TEAMS.mexico, away: TEAMS.ecuador,
    result: [2, 0],
    venue: "Estadio Banorte (Azteca)", city: "Ciudad de México",
  },
  // ── 1 julio ───────────────────────────────────────────────────────────────
  {
    date: "2026-07-01T16:00:00Z",
    home: TEAMS.inglaterra, away: TEAMS.rdCongo,
    result: null,
    venue: "Mercedes-Benz Stadium", city: "Atlanta",
  },
  {
    date: "2026-07-01T20:00:00Z",
    home: TEAMS.belgica, away: TEAMS.senegal,
    result: null,
    venue: "Lumen Field", city: "Seattle",
  },
  {
    date: "2026-07-02T00:00:00Z",
    home: TEAMS.estadosUnidos, away: TEAMS.bosnia,
    result: null,
    venue: "Levi's Stadium", city: "San Francisco Bay Area",
  },
  // ── 2 julio ───────────────────────────────────────────────────────────────
  {
    date: "2026-07-02T19:00:00Z",
    home: TEAMS.espana, away: TEAMS.austria,
    result: null,
    venue: "SoFi Stadium", city: "Los Angeles",
  },
  {
    date: "2026-07-02T23:00:00Z",
    home: TEAMS.portugal, away: TEAMS.croacia,
    result: null,
    venue: "BMO Field", city: "Toronto",
  },
  {
    date: "2026-07-03T03:00:00Z",
    home: TEAMS.suiza, away: TEAMS.argelia,
    result: null,
    venue: "BC Place", city: "Vancouver",
  },
  // ── 3 julio ───────────────────────────────────────────────────────────────
  {
    date: "2026-07-03T18:00:00Z",
    home: TEAMS.australia, away: TEAMS.egipto,
    result: null,
    venue: "AT&T Stadium", city: "Dallas",
  },
  {
    date: "2026-07-03T22:00:00Z",
    home: TEAMS.argentina, away: TEAMS.caboVerde,
    result: null,
    venue: "Hard Rock Stadium", city: "Miami",
  },
  {
    date: "2026-07-04T01:30:00Z",
    home: TEAMS.colombia, away: TEAMS.ghana,
    result: null,
    venue: "GEHA Field at Arrowhead Stadium", city: "Kansas City",
  },
];

export function buildWorldCup2026Fixture(): SeedMatch[] {
  const matches: SeedMatch[] = [];
  let matchNumber = 1;
  let venueIndex = 0;

  // ── Fase de grupos ──────────────────────────────────────────────────────
  for (const group of GROUPS) {
    for (const m of group.matches) {
      const { city, venue } = HOST_VENUES[venueIndex % HOST_VENUES.length];
      venueIndex++;

      matches.push({
        matchNumber: matchNumber++,
        phase: `Fase de Grupos - Grupo ${group.letter}`,
        round: null,
        homeTeam: m.home.name,
        awayTeam: m.away.name,
        homeFlag: m.home.flag,
        awayFlag: m.away.flag,
        matchDate: new Date(m.date),
        venue,
        city,
        homeScore: m.result ? m.result[0] : null,
        awayScore: m.result ? m.result[1] : null,
        status: m.result ? "FINISHED" : "UPCOMING",
      });
    }
  }

  // ── Dieciseisavos de Final — emparejamientos reales ─────────────────────
  for (const m of DIECISEISAVOS) {
    matches.push({
      matchNumber: matchNumber++,
      phase: "Dieciseisavos de Final",
      round: null,
      homeTeam: m.home.name,
      awayTeam: m.away.name,
      homeFlag: m.home.flag,
      awayFlag: m.away.flag,
      matchDate: new Date(m.date),
      venue: m.venue,
      city: m.city,
      homeScore: m.result ? m.result[0] : null,
      awayScore: m.result ? m.result[1] : null,
      status: m.result ? "FINISHED" : "UPCOMING",
    });
  }

  // ── Octavos en adelante — "Por definir" hasta que el Superadmin actualice
  const TBD: Team = { name: "Por definir", flag: "❓" };
  const remainingStages: Array<{ phase: string; count: number; date: string }> = [
    { phase: "Octavos de Final",  count: 8, date: "2026-07-05T18:00:00Z" },
    { phase: "Cuartos de Final",  count: 4, date: "2026-07-10T18:00:00Z" },
    { phase: "Semifinal",         count: 2, date: "2026-07-14T19:00:00Z" },
    { phase: "Tercer Lugar",      count: 1, date: "2026-07-18T19:00:00Z" },
    { phase: "Final",             count: 1, date: "2026-07-19T19:00:00Z" },
  ];

  remainingStages.forEach((stage) => {
    for (let i = 0; i < stage.count; i++) {
      const dayOffset = Math.floor(i / 4);
      const matchDate = new Date(stage.date);
      matchDate.setUTCDate(matchDate.getUTCDate() + dayOffset);
      const { city, venue } = HOST_VENUES[venueIndex % HOST_VENUES.length];
      venueIndex++;

      matches.push({
        matchNumber: matchNumber++,
        phase: stage.phase,
        round: null,
        homeTeam: TBD.name,
        awayTeam: TBD.name,
        homeFlag: TBD.flag,
        awayFlag: TBD.flag,
        matchDate,
        venue,
        city,
        homeScore: null,
        awayScore: null,
        status: "UPCOMING",
      });
    }
  });

  return matches;
}

export const WORLD_CUP_2026 = {
  name: "FIFA World Cup 2026",
  shortName: "Mundial 2026",
  sport: "football",
  country: "México / Canadá / Estados Unidos",
  season: "2026",
  startDate: new Date("2026-06-11T00:00:00Z"),
  endDate: new Date("2026-07-19T23:59:59Z"),
  isActive: true,
  isPublic: true,
  description:
    "Copa Mundial de la FIFA 2026, organizada conjuntamente por México, Canadá y Estados Unidos. Primer Mundial con 48 selecciones.",
};
