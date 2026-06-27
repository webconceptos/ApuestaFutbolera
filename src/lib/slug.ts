import { db } from "@/lib/db";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "polla";
  let slug = base;
  let suffix = 2;

  while (await db.pool.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
}

export function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}
