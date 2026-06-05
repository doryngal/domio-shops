import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StorefrontClient } from "@/components/storefront/storefront-client";

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const shop = await prisma.shop.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      logo_url: true,
      whatsapp_number: true,
      instagram_url: true,
      theme: true,
      whatsapp_template: true,
      status: true,
    },
  });

  if (!shop || shop.status === "suspended") notFound();

  const products = await prisma.product.findMany({
    where: { shop_id: shop.id, is_active: true },
    orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
  });

  // Get unique categories
  const categorySet = new Set(products.map((p) => p.category).filter(Boolean) as string[]);
  const categories = Array.from(categorySet);

  const theme = shop.theme as { accent: string; button_color: string; font: string };

  return (
    <StorefrontClient
      shop={{ ...shop, theme, whatsapp_template: shop.whatsapp_template ?? null }}
      initialProducts={products.map((p) => ({
        ...p,
        price: parseFloat(p.price.toString()),
      }))}
      categories={categories}
    />
  );
}
