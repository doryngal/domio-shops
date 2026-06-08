import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShopSession, unauthorized } from "@/lib/session";

export async function GET(_request: NextRequest) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const shop = await prisma.shop.findUnique({ where: { id: session.shopId } });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const RESERVED_SLUGS = [
  "dashboard", "orders", "analytics", "settings", "products",
  "login", "logout", "api", "admin", "founder", "shop", "storefront",
];

export async function PUT(request: NextRequest) {
  try {
    const session = await getShopSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const {
      name,
      description,
      logo_url,
      whatsapp_number,
      instagram_url,
      theme,
      whatsapp_template,
      custom_domain,
    } = body;

    if (body.slug && RESERVED_SLUGS.includes(body.slug)) {
      return NextResponse.json({ error: "Этот slug зарезервирован" }, { status: 400 });
    }

    const shop = await prisma.shop.update({
      where: { id: session.shopId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(logo_url !== undefined && { logo_url }),
        ...(whatsapp_number !== undefined && { whatsapp_number }),
        ...(instagram_url !== undefined && { instagram_url }),
        ...(theme !== undefined && { theme }),
        ...(whatsapp_template !== undefined && { whatsapp_template }),
        ...(custom_domain !== undefined && { custom_domain }),
      },
    });

    return NextResponse.json(shop);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
