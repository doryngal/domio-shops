"use client";
import { useState, useEffect, useRef } from "react";
import { StorefrontHeader } from "./storefront-header";
import { CartDrawer } from "./cart-drawer";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";
import { useCart } from "./cart-context";
import { Search, X, ShoppingCart } from "lucide-react";
import { formatPrice, generateSessionId } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  category: string | null;
  in_stock: boolean;
  options?: { name: string; values: string[] }[];
}

interface Shop {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  whatsapp_number: string;
  instagram_url: string | null;
  theme: { accent: string; button_color: string; font: string };
  whatsapp_template: string | null;
}

interface StorefrontClientProps {
  shop: Shop;
  initialProducts: Product[];
  categories: string[];
}

function MobileCartIsland({ accentColor }: { accentColor: string }) {
  const { count, total, setIsOpen, isOpen } = useCart();
  const [prevCount, setPrevCount] = useState(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (count > prevCount && count > 0) {
      setBump(true);
      setTimeout(() => setBump(false), 300);
    }
    setPrevCount(count);
  }, [count]);

  if (count === 0) return null;
  return (
    <div
      className={`md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isOpen
          ? "opacity-0 pointer-events-none translate-y-4"
          : "opacity-100 pointer-events-auto translate-y-0 animate-fade-up"
      }`}
    >
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[#0d0d0d] font-semibold text-sm cursor-pointer transition-transform duration-150 active:scale-95 ${bump ? "scale-105" : "scale-100"}`}
        style={{
          background: accentColor,
          boxShadow: `0 8px 32px ${accentColor}60, 0 2px 8px rgba(0,0,0,0.4)`,
        }}
      >
        <div className="relative">
          <ShoppingCart size={18} />
          <span
            className="absolute -top-2 -right-2 w-4 h-4 bg-[#0d0d0d] text-[10px] font-bold rounded-full flex items-center justify-center animate-pop"
            style={{ color: accentColor }}
          >
            {count > 9 ? "9+" : count}
          </span>
        </div>
        <span>Корзина</span>
        <span className="opacity-50">·</span>
        <span className="tabular-nums">{formatPrice(total)} ₸</span>
      </button>
    </div>
  );
}

export function StorefrontClient({ shop, initialProducts, categories }: StorefrontClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const accentColor = shop.theme.accent || "#C9A84C";
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const sessionId = localStorage.getItem("session_id") || generateSessionId();
    localStorage.setItem("session_id", sessionId);
    fetch(`/api/storefront/${shop.slug}/events/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, page: "/", referrer: document.referrer || null }),
    }).catch(() => {});
  }, [shop.slug]);

  const filtered = initialProducts.filter((p) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <StorefrontHeader
        name={shop.name}
        logoUrl={shop.logo_url}
        instagramUrl={shop.instagram_url}
        accentColor={accentColor}
      />

      <CartDrawer
        shopSlug={shop.slug}
        whatsappNumber={shop.whatsapp_number}
        accentColor={accentColor}
        whatsappTemplate={shop.whatsapp_template}
      />

      <ProductModal
        product={openProduct ? { ...openProduct, options: openProduct.options || [] } : null}
        accentColor={accentColor}
        onClose={() => setOpenProduct(null)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {shop.description && (
          <p className="text-[#888880] text-sm">{shop.description}</p>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888880]" />
          <input
            type="search"
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#141414] border border-[#2a2a2a] rounded-xl text-[#f5f0e8] placeholder:text-[#555550] focus:outline-none focus:border-[#3a3a3a] text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#f5f0e8] cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${!activeCategory ? "text-[#0d0d0d]" : "bg-[#141414] border border-[#2a2a2a] text-[#888880] hover:text-[#f5f0e8]"}`}
              style={!activeCategory ? { background: accentColor } : {}}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${activeCategory === cat ? "text-[#0d0d0d]" : "bg-[#141414] border border-[#2a2a2a] text-[#888880] hover:text-[#f5f0e8]"}`}
                style={activeCategory === cat ? { background: accentColor } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#888880] animate-fade-up">
            <p className="text-lg">Товары не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((product, idx) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
              >
                <ProductCard
                  {...product}
                  accentColor={accentColor}
                  onOpen={() => setOpenProduct(product)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileCartIsland accentColor={accentColor} />

      <footer className="pb-24 md:pb-0 text-center py-8 text-[#888880] text-xs border-t border-[#2a2a2a] mt-12">
        Работает на{" "}
        <a href="https://domio.top" className="text-[#C9A84C] hover:underline">
          Domio Shops
        </a>
      </footer>
    </div>
  );
}
