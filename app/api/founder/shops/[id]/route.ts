import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFounderSession, unauthorized } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getFounderSession();
    if (!session) return unauthorized();

    const shop = await prisma.shop.findUnique({
      where: { id: params.id },
      include: {
        users: { select: { id: true, email: true, role: true, last_login_at: true } },
        _count: { select: { products: true, order_events: true, page_views: true } },
      },
    });

    if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(shop);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getFounderSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, description, whatsapp_number, instagram_url, status, subscription_ends_at } = body;

    const shop = await prisma.shop.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(whatsapp_number !== undefined && { whatsapp_number }),
        ...(instagram_url !== undefined && { instagram_url }),
        ...(status !== undefined && { status }),
        ...(subscription_ends_at !== undefined && {
          subscription_ends_at: subscription_ends_at ? new Date(subscription_ends_at) : null,
        }),
      },
    });

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
