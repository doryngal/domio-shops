import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopSession, unauthorized } from "@/lib/session";

export async function GET(_request: NextRequest) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const products = await prisma.product.findMany({
      where: { shop_id: session.shopId },
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, description, price, images, category, in_stock, is_active, sort_order } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        shop_id: session.shopId,
        name,
        description: description || null,
        price: parseFloat(price),
        images: images || [],
        category: category || null,
        in_stock: in_stock ?? true,
        is_active: is_active ?? true,
        sort_order: sort_order || 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
