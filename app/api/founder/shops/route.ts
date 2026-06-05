import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFounderSession, unauthorized } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function GET(_request: NextRequest) {
  try {
    const session = await getFounderSession();
    if (!session) return unauthorized();

    const shops = await prisma.shop.findMany({
      include: {
        users: { select: { id: true, email: true, role: true } },
        _count: { select: { products: true, order_events: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(shops);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getFounderSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { slug, name, description, whatsapp_number, owner_email, owner_password } = body;

    if (!slug || !name || !whatsapp_number || !owner_email || !owner_password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.shop.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 400 });
    }

    const hash = await bcrypt.hash(owner_password, 12);

    const shop = await prisma.shop.create({
      data: {
        slug,
        name,
        description,
        whatsapp_number,
        users: {
          create: {
            email: owner_email,
            password_hash: hash,
            role: "shop_owner",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
