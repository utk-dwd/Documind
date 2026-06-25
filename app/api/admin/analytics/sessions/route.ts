import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

type Trunc = "day" | "week" | "month";

const TRUNC_SQL: Record<Trunc, string> = {
  day: "date_trunc('day', \"createdAt\")",
  week: "date_trunc('week', \"createdAt\")",
  month: "date_trunc('month', \"createdAt\")",
};

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "day") as Trunc;
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 90);

  const trunc = TRUNC_SQL[period] || TRUNC_SQL.day;

  const rows = await prisma.$queryRawUnsafe<
    Array<{ label: string; count: bigint }>
  >(
    `SELECT ${trunc}::text AS label, COUNT(*)::bigint AS count
     FROM "ChatSession"
     WHERE "createdAt" >= NOW() - INTERVAL '${limit} ${period}s'
     GROUP BY ${trunc}
     ORDER BY ${trunc} ASC`
  );

  const data = rows.map((r) => {
    const raw = r.label;
    let label: string;
    switch (period) {
      case "day":
        label = raw.slice(5, 10);
        break;
      case "week":
        label = raw.slice(0, 10);
        break;
      case "month":
        label = raw.slice(0, 7);
        break;
      default:
        label = raw.slice(0, 10);
    }
    return { label, count: Number(r.count) };
  });

  return NextResponse.json({ period, data });
}
