import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFounderSession, unauthorized } from "@/lib/session";

export async function GET(_request: NextRequest) {
  try {
  const session = await getFounderSession();
  if (!session) return unauthorized();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalShops,
    activeShops,
    trialShops,
    expiredShops,
    suspendedShops,
    mauSessions,
    topShops,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "active" } }),
    prisma.shop.count({ where: { status: "trial" } }),
    prisma.shop.count({ where: { status: "expired" } }),
    prisma.shop.count({ where: { status: "suspended" } }),
    prisma.pageView.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { session_id: true },
      distinct: ["session_id"],
    }),
    prisma.shop.findMany({
      include: { _count: { select: { page_views: true, order_events: true } } },
      orderBy: { page_views: { _count: "desc" } },
      take: 5,
    }),
  ]);

  // Shops created per month (last 6 months)
  const shopGrowth = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
    FROM "Shop"
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
    ORDER BY month ASC
  `;

  return NextResponse.json({
    totalShops,
    activeShops,
    trialShops,
    expiredShops,
    suspendedShops,
    mau: mauSessions.length,
    topShops: topShops.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      status: s.status,
      views: s._count.page_views,
      orders: s._count.order_events,
    })),
    shopGrowth: shopGrowth.map((s) => ({ month: s.month, count: Number(s.count) })),
  });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
