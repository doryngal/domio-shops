"use client";
import { useCart } from "./cart-context";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

interface StorefrontHeaderProps {
  name: string;
  logoUrl: string | null;
  instagramUrl: string | null;
  accentColor?: string;
}

export function StorefrontHeader({
  name,
  logoUrl,
  instagramUrl,
  accentColor = "#C9A84C",
}: StorefrontHeaderProps) {
  const { count, setIsOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(20,20,20,0.96)" : "rgba(13,13,13,0.85)",
        backdropFilter: `blur(${scrolled ? 20 : 8}px)`,
        borderBottom: scrolled ? "1px solid #2a2a2a" : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0d0d0d] font-bold text-sm shadow-lg"
              style={{ background: accentColor }}
            >
              {name[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-bold text-[#f5f0e8] text-base md:text-lg tracking-tight">{name}</span>
        </div>

        <div className="flex items-center gap-1">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] transition-colors cursor-pointer rounded-xl hover:bg-white/5"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-11 h-11 flex items-center justify-center text-[#f5f0e8] hover:text-white transition-all duration-150 cursor-pointer rounded-xl hover:bg-white/5 active:scale-95"
            aria-label={`Корзина: ${count} товаров`}
          >
            <ShoppingCart size={21} />
            {count > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 rounded-full text-[9px] font-bold text-[#0d0d0d] flex items-center justify-center transition-transform duration-200 scale-100"
                style={{ background: accentColor }}
              >
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
