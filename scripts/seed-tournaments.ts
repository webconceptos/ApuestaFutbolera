// Fixture REAL de la FIFA World Cup 2026: sorteo oficial de grupos (5 dic
// 2025) y resultados oficiales de la fase de grupos cargados desde fuentes
// públicas (Wikipedia) al 21 de junio de 2026. Reemplaza el fixture
// placeholder usado para desarrollar/probar la app antes de que existiera el
// sorteo real (ver historial: el placeholder original solo garantizaba los 3
// anfitriones).
//
// Los horarios de kickoff de la fase de grupos son los reales (hora local del
// estadio convertida a UTC, fuente: Wikipedia por grupo) — un primer intento
// usó 18:00 UTC fijo para todos los partidos, lo cual generaba confusión real
// para los usuarios. Las sedes/ciudades sí son aproximadas (se ciclan entre
// las 16 sedes oficiales) ya que no son relevantes para predicciones/scoring,
// solo texto informativo.
//
// La fase eliminatoria (Dieciseisavos en adelante) todavía no tiene
// emparejamientos reales porque la fase de grupos no terminó: se mantienen
// como "Por definir" hasta que el Superadmin los actualice con los
// resultados oficiales según avance el torneo.

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
  date: string; // ISO datetime completo en UTC (hora real de kickoff, no un placeholder)
  home: Team;
  away: Team;
  result: [number, number] | null; // null = todavía no jugado
}

interface GroupSeed {
  letter: string;
  matches: GroupMatchSeed[];
}

// Resultados oficiales de la fase de grupos al 21 de junio de 2026.
const GROUPS: GroupSeed[] = [
  {
    letter: "A",
    matches: [
      { date: "2026-06-11T19:00:00Z", home: TEAMS.mexico, away: TEAMS.sudafrica, result: [2, 0] },
      { date: "2026-06-12T02:00:00Z", home: TEAMS.coreaDelSur, away: TEAMS.republicaCheca, result: [2, 1] },
      { date: "2026-06-18T16:00:00Z", home: TEAMS.republicaCheca, away: TEAMS.sudafrica, result: [1, 1] },
      { date: "2026-06-19T01:00:00Z", home: TEAMS.mexico, away: TEAMS.coreaDelSur, result: [1, 0] },
      { date: "2026-06-25T01:00:00Z", home: TEAMS.republicaCheca, away: TEAMS.mexico, result: null },
      { date: "2026-06-25T01:00:00Z", home: TEAMS.sudafrica, away: TEAMS.coreaDelSur, result: null },
    ],
  },
  {
    letter: "B",
    matches: [
      { date: "2026-06-12T19:00:00Z", home: TEAMS.canada, away: TEAMS.bosnia, result: [1, 1] },
      { date: "2026-06-13T19:00:00Z", home: TEAMS.catar, away: TEAMS.suiza, result: [1, 1] },
      { date: "2026-06-18T19:00:00Z", home: TEAMS.suiza, away: TEAMS.bosnia, result: [4, 1] },
      { date: "2026-06-18T22:00:00Z", home: TEAMS.canada, away: TEAMS.catar, result: [6, 0] },
      { date: "2026-06-24T19:00:00Z", home: TEAMS.suiza, away: TEAMS.canada, result: null },
      { date: "2026-06-24T19:00:00Z", home: TEAMS.bosnia, away: TEAMS.catar, result: null },
    ],
  },
  {
    letter: "C",
    matches: [
      { date: "2026-06-13T22:00:00Z", home: TEAMS.brasil, away: TEAMS.marruecos, result: [1, 1] },
      { date: "2026-06-14T01:00:00Z", home: TEAMS.haiti, away: TEAMS.escocia, result: [0, 1] },
      { date: "2026-06-19T22:00:00Z", home: TEAMS.escocia, away: TEAMS.marruecos, result: [0, 1] },
      { date: "2026-06-20T00:30:00Z", home: TEAMS.brasil, away: TEAMS.haiti, result: [3, 0] },
      { date: "2026-06-24T22:00:00Z", home: TEAMS.escocia, away: TEAMS.brasil, result: null },
      { date: "2026-06-24T22:00:00Z", home: TEAMS.marruecos, away: TEAMS.haiti, result: null },
    ],
  },
  {
    letter: "D",
    matches: [
      { date: "2026-06-13T01:00:00Z", home: TEAMS.estadosUnidos, away: TEAMS.paraguay, result: [4, 1] },
      { date: "2026-06-14T04:00:00Z", home: TEAMS.australia, away: TEAMS.turquia, result: [2, 0] },
      { date: "2026-06-19T19:00:00Z", home: TEAMS.estadosUnidos, away: TEAMS.australia, result: [2, 0] },
      { date: "2026-06-20T03:00:00Z", home: TEAMS.turquia, away: TEAMS.paraguay, result: [0, 1] },
      { date: "2026-06-26T02:00:00Z", home: TEAMS.turquia, away: TEAMS.estadosUnidos, result: null },
      { date: "2026-06-26T02:00:00Z", home: TEAMS.paraguay, away: TEAMS.australia, result: null },
    ],
  },
  {
    letter: "E",
    matches: [
      { date: "2026-06-14T17:00:00Z", home: TEAMS.alemania, away: TEAMS.curazao, result: [7, 1] },
      { date: "2026-06-14T23:00:00Z", home: TEAMS.costaDeMarfil, away: TEAMS.ecuador, result: [1, 0] },
      { date: "2026-06-20T20:00:00Z", home: TEAMS.alemania, away: TEAMS.costaDeMarfil, result: [2, 1] },
      { date: "2026-06-21T00:00:00Z", home: TEAMS.ecuador, away: TEAMS.curazao, result: [0, 0] },
      { date: "2026-06-25T20:00:00Z", home: TEAMS.curazao, away: TEAMS.costaDeMarfil, result: null },
      { date: "2026-06-25T20:00:00Z", home: TEAMS.ecuador, away: TEAMS.alemania, result: null },
    ],
  },
  {
    letter: "F",
    matches: [
      { date: "2026-06-14T20:00:00Z", home: TEAMS.paisesBajos, away: TEAMS.japon, result: [2, 2] },
      { date: "2026-06-15T02:00:00Z", home: TEAMS.suecia, away: TEAMS.tunez, result: [5, 1] },
      { date: "2026-06-20T17:00:00Z", home: TEAMS.paisesBajos, away: TEAMS.suecia, result: [5, 1] },
      { date: "2026-06-21T04:00:00Z", home: TEAMS.tunez, away: TEAMS.japon, result: [0, 4] },
      { date: "2026-06-25T23:00:00Z", home: TEAMS.japon, away: TEAMS.suecia, result: null },
      { date: "2026-06-25T23:00:00Z", home: TEAMS.tunez, away: TEAMS.paisesBajos, result: null },
    ],
  },
  {
    letter: "G",
    matches: [
      { date: "2026-06-15T19:00:00Z", home: TEAMS.belgica, away: TEAMS.egipto, result: [1, 1] },
      { date: "2026-06-16T01:00:00Z", home: TEAMS.iran, away: TEAMS.nuevaZelanda, result: [2, 2] },
      // Resultado cargado manualmente desde /superadmin el 21 jun (no estaba al momento del fixture base).
      { date: "2026-06-21T19:00:00Z", home: TEAMS.belgica, away: TEAMS.iran, result: [0, 0] },
      { date: "2026-06-22T01:00:00Z", home: TEAMS.nuevaZelanda, away: TEAMS.egipto, result: null },
      { date: "2026-06-27T03:00:00Z", home: TEAMS.egipto, away: TEAMS.iran, result: null },
      { date: "2026-06-27T03:00:00Z", home: TEAMS.nuevaZelanda, away: TEAMS.belgica, result: null },
    ],
  },
  {
    letter: "H",
    matches: [
      { date: "2026-06-15T16:00:00Z", home: TEAMS.espana, away: TEAMS.caboVerde, result: [0, 0] },
      { date: "2026-06-15T22:00:00Z", home: TEAMS.arabiaSaudita, away: TEAMS.uruguay, result: [1, 1] },
      // Resultados cargados manualmente desde /superadmin el 21 jun.
      { date: "2026-06-21T16:00:00Z", home: TEAMS.espana, away: TEAMS.arabiaSaudita, result: [4, 0] },
      { date: "2026-06-21T22:00:00Z", home: TEAMS.uruguay, away: TEAMS.caboVerde, result: [2, 2] },
      { date: "2026-06-27T00:00:00Z", home: TEAMS.caboVerde, away: TEAMS.arabiaSaudita, result: null },
      { date: "2026-06-27T00:00:00Z", home: TEAMS.uruguay, away: TEAMS.espana, result: null },
    ],
  },
  {
    letter: "I",
    matches: [
      { date: "2026-06-16T19:00:00Z", home: TEAMS.francia, away: TEAMS.senegal, result: [3, 1] },
      { date: "2026-06-16T22:00:00Z", home: TEAMS.irak, away: TEAMS.noruega, result: [1, 4] },
      { date: "2026-06-22T21:00:00Z", home: TEAMS.francia, away: TEAMS.irak, result: null },
      { date: "2026-06-23T00:00:00Z", home: TEAMS.noruega, away: TEAMS.senegal, result: null },
      { date: "2026-06-26T19:00:00Z", home: TEAMS.noruega, away: TEAMS.francia, result: null },
      { date: "2026-06-26T19:00:00Z", home: TEAMS.senegal, away: TEAMS.irak, result: null },
    ],
  },
  {
    letter: "J",
    matches: [
      { date: "2026-06-17T01:00:00Z", home: TEAMS.argentina, away: TEAMS.argelia, result: [3, 0] },
      { date: "2026-06-17T04:00:00Z", home: TEAMS.austria, away: TEAMS.jordania, result: [3, 1] },
      { date: "2026-06-22T17:00:00Z", home: TEAMS.argentina, away: TEAMS.austria, result: null },
      { date: "2026-06-23T03:00:00Z", home: TEAMS.jordania, away: TEAMS.argelia, result: null },
      { date: "2026-06-28T02:00:00Z", home: TEAMS.argelia, away: TEAMS.austria, result: null },
      { date: "2026-06-28T02:00:00Z", home: TEAMS.jordania, away: TEAMS.argentina, result: null },
    ],
  },
  {
    letter: "K",
    matches: [
      { date: "2026-06-17T17:00:00Z", home: TEAMS.portugal, away: TEAMS.rdCongo, result: [1, 1] },
      { date: "2026-06-18T02:00:00Z", home: TEAMS.uzbekistan, away: TEAMS.colombia, result: [1, 3] },
      { date: "2026-06-23T17:00:00Z", home: TEAMS.portugal, away: TEAMS.uzbekistan, result: null },
      { date: "2026-06-24T02:00:00Z", home: TEAMS.colombia, away: TEAMS.rdCongo, result: null },
      { date: "2026-06-27T23:30:00Z", home: TEAMS.colombia, away: TEAMS.portugal, result: null },
      { date: "2026-06-27T23:30:00Z", home: TEAMS.rdCongo, away: TEAMS.uzbekistan, result: null },
    ],
  },
  {
    letter: "L",
    matches: [
      { date: "2026-06-17T20:00:00Z", home: TEAMS.inglaterra, away: TEAMS.croacia, result: [4, 2] },
      { date: "2026-06-17T23:00:00Z", home: TEAMS.ghana, away: TEAMS.panama, result: [1, 0] },
      { date: "2026-06-23T20:00:00Z", home: TEAMS.inglaterra, away: TEAMS.ghana, result: null },
      { date: "2026-06-23T23:00:00Z", home: TEAMS.panama, away: TEAMS.croacia, result: null },
      { date: "2026-06-27T21:00:00Z", home: TEAMS.panama, away: TEAMS.inglaterra, result: null },
      { date: "2026-06-27T21:00:00Z", home: TEAMS.croacia, away: TEAMS.ghana, result: null },
    ],
  },
];

export function buildWorldCup2026Fixture(): SeedMatch[] {
  const matches: SeedMatch[] = [];
  let matchNumber = 1;
  let venueIndex = 0;

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

  // Fase eliminatoria: todavía no hay emparejamientos reales (la fase de
  // grupos no terminó). Se cargan como "Por definir" para que el Superadmin
  // los actualice manualmente con el bracket oficial cuando se confirme.
  const TBD: Team = { name: "Por definir", flag: "❓" };
  const knockoutStages: Array<{ phase: string; count: number; date: string }> = [
    { phase: "Dieciseisavos de Final", count: 16, date: "2026-06-28T18:00:00Z" },
    { phase: "Octavos de Final", count: 8, date: "2026-07-04T18:00:00Z" },
    { phase: "Cuartos de Final", count: 4, date: "2026-07-10T18:00:00Z" },
    { phase: "Semifinal", count: 2, date: "2026-07-14T19:00:00Z" },
    { phase: "Tercer Lugar", count: 1, date: "2026-07-18T19:00:00Z" },
    { phase: "Final", count: 1, date: "2026-07-19T19:00:00Z" },
  ];

  knockoutStages.forEach((stage) => {
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
