import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopSession, unauthorized } from "@/lib/session";

export async function GET(_request: NextRequest) {
  try {
  const session = await getShopSession();
  if (!session) return unauthorized();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total views
  const totalViews = await prisma.pageView.count({
    where: { shop_id: session.shopId, created_at: { gte: thirtyDaysAgo } },
  });

  // Cart adds (page = "cart")
  const cartAdds = await prisma.pageView.count({
    where: { shop_id: session.shopId, page: "cart", created_at: { gte: thirtyDaysAgo } },
  });

  // WhatsApp clicks
  const waClicks = await prisma.orderEvent.count({
    where: { shop_id: session.shopId, whatsapp_clicked: true, created_at: { gte: thirtyDaysAgo } },
  });

  // Conversion %
  const conversion = totalViews > 0 ? ((waClicks / totalViews) * 100).toFixed(1) : "0";

  // Views by day (last 14 days)
  const viewsByDay = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM "PageView"
    WHERE shop_id = ${session.shopId}
    AND created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  // Top products by views
  const topProductViews = await prisma.pageView.groupBy({
    by: ["product_id"],
    where: {
      shop_id: session.shopId,
      product_id: { not: null },
      created_at: { gte: thirtyDaysAgo },
    },
    _count: { product_id: true },
    orderBy: { _count: { product_id: "desc" } },
    take: 5,
  });

  const productIds = topProductViews.map((p) => p.product_id).filter(Boolean) as string[];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const topProducts = topProductViews.map((p) => ({
    product: productMap[p.product_id!] ?? null,
    views: Number(p._count.product_id),
  }));

  // Referrers
  const referrers = await prisma.pageView.groupBy({
    by: ["referrer"],
    where: {
      shop_id: session.shopId,
      referrer: { not: null },
      created_at: { gte: thirtyDaysAgo },
    },
    _count: { referrer: true },
    orderBy: { _count: { referrer: "desc" } },
    take: 10,
  });

  return NextResponse.json({
    totalViews,
    cartAdds,
    waClicks,
    conversion,
    viewsByDay: viewsByDay.map((v) => ({ date: v.date, count: Number(v.count) })),
    topProducts,
    referrers: referrers.map((r) => ({ referrer: r.referrer, count: Number(r._count.referrer) })),
  });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
