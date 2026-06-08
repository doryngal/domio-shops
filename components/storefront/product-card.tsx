"use client";
import { useState, useRef } from "react";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Package, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductOption {
  name: string;
  values: string[];
}

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  in_stock: boolean;
  options?: ProductOption[];
  accentColor?: string;
  onOpen: () => void;
}

export function ProductCard({
  id, name, description, price, images, in_stock,
  options = [], accentColor = "#C9A84C", onOpen,
}: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCart();
  const hasOptions = options.length > 0;

  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const cartKey = id;
  const cartItem = !hasOptions ? items.find((i) => i.cartKey === cartKey) : null;
  const qty = cartItem?.quantity ?? 0;
  const totalQty = items.filter((i) => i.id === id).reduce((s, i) => s + i.quantity, 0);

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };
  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      if (dx < 0) setImgIdx((i) => (i + 1) % images.length);
      else setImgIdx((i) => (i - 1 + images.length) % images.length);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!in_stock) return;
    if (hasOptions) { onOpen(); return; }
    addItem({ id, name, price, image: images[0] || null, variants: [] });
  };
  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id, name, price, image: images[0] || null, variants: [] });
  };
  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(cartKey, qty - 1);
  };

  return (
    <div
      onClick={onOpen}
      className="group bg-[#141414] border rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:border-[#3a3a3a] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0"
      style={{
        borderColor: totalQty > 0 ? accentColor + "50" : "#2a2a2a",
        boxShadow: totalQty > 0 ? `0 0 0 1px ${accentColor}30` : undefined,
      }}
    >
      {/* Image area */}
      <div
        className="aspect-square relative overflow-hidden bg-[#1a1a1a] select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 0 ? (
          <>
            {/* preload adjacent */}
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={i === imgIdx ? name : ""}
                aria-hidden={i !== imgIdx}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                style={{ opacity: i === imgIdx ? 1 : 0, pointerEvents: "none" }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}

            {/* arrow nav — only on desktop hover */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0d0d0d]/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0d0d0d]/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
                  aria-label="Следующее фото"
                >
                  <ChevronRight size={14} />
                </button>

                {/* dot indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className="block h-1 rounded-full transition-all duration-200"
                      style={{
                        width: i === imgIdx ? 16 : 4,
                        background: i === imgIdx ? accentColor : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-[#2a2a2a]" />
          </div>
        )}

        {/* out of stock overlay */}
        {!in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <span className="text-xs text-white font-medium bg-[#333]/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Нет в наличии
            </span>
          </div>
        )}

        {/* cart badge */}
        {totalQty > 0 && (
          <div
            className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1 rounded-full text-[10px] font-bold text-[#0d0d0d] flex items-center justify-center shadow-lg z-10"
            style={{ background: accentColor }}
          >
            {totalQty}
          </div>
        )}

        {/* options hint */}
        {hasOptions && in_stock && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0d0d0d]/60 backdrop-blur-sm text-[#aaa]">
              {options.map((o) => o.name).join(" · ")}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-semibold text-[#f5f0e8] line-clamp-2 leading-snug">{name}</h3>
        {description && (
          <p className="text-[11px] text-[#666660] line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="mt-auto pt-2.5 flex items-center justify-between gap-2">
          <span className="font-bold text-sm shrink-0" style={{ color: accentColor }}>
            {formatPrice(price)} ₸
          </span>

          {!hasOptions && qty > 0 ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleDecrease}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform cursor-pointer"
                style={{ background: accentColor }}
                aria-label="Убрать"
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-bold text-[#f5f0e8]">{qty}</span>
              <button
                onClick={handleIncrease}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform cursor-pointer"
                style={{ background: accentColor }}
                aria-label="Добавить"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!in_stock}
              className="h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-[#0d0d0d] active:scale-95 transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: in_stock ? accentColor : "#2a2a2a" }}
              aria-label={hasOptions ? `Выбрать ${name}` : `В корзину: ${name}`}
            >
              <ShoppingCart size={13} />
              <span className="hidden sm:inline">{hasOptions ? "Выбрать" : "В корзину"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
