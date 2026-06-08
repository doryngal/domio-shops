import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopSession, unauthorized } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const product = await prisma.product.findFirst({
      where: { id: params.id, shop_id: session.shopId },
    });

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const existing = await prisma.product.findFirst({
      where: { id: params.id, shop_id: session.shopId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const { name, description, price, images, category, in_stock, is_active, sort_order, options } = body;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(String(price)) }),
        ...(images !== undefined && { images }),
        ...(category !== undefined && { category }),
        ...(in_stock !== undefined && { in_stock }),
        ...(is_active !== undefined && { is_active }),
        ...(sort_order !== undefined && { sort_order }),
        ...(options !== undefined && { options }),
      },
    });

    return NextResponse.json(product);
  } catch (e) {
    console.error("[PUT /api/shop/products/:id]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const existing = await prisma.product.findFirst({
      where: { id: params.id, shop_id: session.shopId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
