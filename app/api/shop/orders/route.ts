import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopSession, unauthorized } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
  const session = await getShopSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7d";

  let dateFrom = new Date();
  if (period === "today") {
    dateFrom.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    dateFrom.setDate(dateFrom.getDate() - 7);
  } else if (period === "30d") {
    dateFrom.setDate(dateFrom.getDate() - 30);
  } else {
    dateFrom = new Date(0); // all time
  }

  const orders = await prisma.orderEvent.findMany({
    where: {
      shop_id: session.shopId,
      created_at: { gte: dateFrom },
    },
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Enrich with product names
  const allProductIds = Array.from(new Set(orders.flatMap((o) => o.product_ids)));
  const products = await prisma.product.findMany({
    where: { id: { in: allProductIds } },
    select: { id: true, name: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const enriched = orders.map((order) => ({
    ...order,
    product_names: order.product_ids.map((id) => productMap[id] || id),
  }));

  return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
