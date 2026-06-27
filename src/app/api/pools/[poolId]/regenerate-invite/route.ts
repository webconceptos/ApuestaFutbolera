import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { generateInviteCode } from "@/lib/slug";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const inviteCode = generateInviteCode();
  await db.pool.update({ where: { id: poolId }, data: { inviteCode } });

  return NextResponse.json({ success: true, inviteCode });
}
