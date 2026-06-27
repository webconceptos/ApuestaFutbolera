import { PrismaClient } from "@prisma/client";
import { buildWorldCup2026Fixture, WORLD_CUP_2026 } from "../scripts/seed-tournaments";

const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.upsert({
    where: { id: "wc2026" },
    update: {},
    create: { id: "wc2026", ...WORLD_CUP_2026 },
  });

  const matches = buildWorldCup2026Fixture();

  for (const match of matches) {
    await prisma.match.upsert({
      where: { tournamentId_matchNumber: { tournamentId: tournament.id, matchNumber: match.matchNumber } },
      update: { ...match },
      create: { ...match, tournamentId: tournament.id },
    });
  }

  console.log(`Seed completo: torneo "${tournament.shortName}" con ${matches.length} partidos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
