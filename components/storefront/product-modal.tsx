"use client";
import { useState, useEffect, useRef } from "react";
import { useCart, CartVariant } from "./cart-context";
import { useDragDismiss } from "@/hooks/use-drag-dismiss";
import { formatPrice } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, ShoppingCart, Plus, Minus, Package, Check } from "lucide-react";

export interface ProductOption {
  name: string;
  values: string[];
}

interface ProductModalProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  in_stock: boolean;
  options: ProductOption[];
}

interface ProductModalProps {
  product: ProductModalProduct | null;
  accentColor: string;
  onClose: () => void;
}

export function ProductModal({ product, accentColor, onClose }: ProductModalProps) {
  const { addItem, updateQuantity, items } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [addedPulse, setAddedPulse] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { sheetRef, onTouchStart: onDragStart, onTouchMove: onDragMove, onTouchEnd: onDragEnd } = useDragDismiss({ onClose });

  useEffect(() => {
    if (!product) return;
    setImgIdx(0);
    const init: Record<string, string> = {};
    product.options.forEach((o) => { if (o.values.length === 1) init[o.name] = o.values[0]; });
    setSelected(init);
    setAddedPulse(false);
  }, [product?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (product) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [product?.id]);

  if (!product) return null;

  const allSelected = product.options.every((o) => selected[o.name]);
  const variants: CartVariant[] = product.options.map((o) => ({
    name: o.name, value: selected[o.name] || "",
  }));
  const cartKey = product.id + (variants.length
    ? "|" + variants.map((v) => `${v.name}:${v.value}`).join(",")
    : "");
  const cartItem = items.find((i) => i.cartKey === cartKey);
  const qty = cartItem?.quantity ?? 0;
  const totalQty = items.filter((i) => i.id === product.id).reduce((s, i) => s + i.quantity, 0);
  const canAdd = product.in_stock && (product.options.length === 0 || allSelected);
  const missingOptions = product.options.filter((o) => !selected[o.name]);

  const handleAdd = () => {
    if (!canAdd) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images[0] || null, variants });
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 600);
  };
  const handleIncrease = () => {
    if (!canAdd) return;
    addItem({ id: product.id, name: product.name, price: product.price, image: product.images[0] || null, variants });
  };
  const handleDecrease = () => updateQuantity(cartKey, qty - 1);

  const prevImg = () => setImgIdx((i) => (i - 1 + product.images.length) % product.images.length);
  const nextImg = () => setImgIdx((i) => (i + 1) % product.images.length);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) nextImg(); else prevImg();
    }
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md transition-all duration-300"
        style={{ background: visible ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full md:max-w-[680px] md:mx-4 bg-[#141414] md:rounded-3xl rounded-t-[28px] overflow-hidden flex flex-col shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          maxHeight: "92dvh",
          transform: visible ? "translateY(0)" : "translateY(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        {/* Mobile handle — drag zone */}
        <div
          className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0 touch-none"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          aria-hidden="true"
        >
          <div className="w-9 h-1 rounded-full bg-[#444]" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#0d0d0d]/80 backdrop-blur-sm flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] transition-colors cursor-pointer"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto flex-1 md:grid md:grid-cols-[45%_55%]">
          {/* ── Gallery ── */}
          <div className="flex-shrink-0">
            <div
              className="aspect-square relative bg-[#1a1a1a] overflow-hidden select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {product.images.length > 0 ? (
                <>
                  {product.images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={i === imgIdx ? product.name : ""}
                      aria-hidden={i !== imgIdx}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                      style={{ opacity: i === imgIdx ? 1 : 0 }}
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ))}

                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0d0d0d]/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#0d0d0d]/90 transition-colors cursor-pointer z-10"
                        aria-label="Предыдущее фото"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0d0d0d]/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#0d0d0d]/90 transition-colors cursor-pointer z-10"
                        aria-label="Следующее фото"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {product.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className="h-1.5 rounded-full transition-all duration-200 cursor-pointer"
                            style={{ width: i === imgIdx ? 20 : 6, background: i === imgIdx ? accentColor : "rgba(255,255,255,0.35)" }}
                            aria-label={`Фото ${i + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {totalQty > 0 && (
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-[#0d0d0d] z-10"
                      style={{ background: accentColor }}
                    >
                      <ShoppingCart size={11} />
                      {totalQty}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-[#2a2a2a]" />
                </div>
              )}

              {!product.in_stock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="text-sm text-white font-medium bg-[#333]/80 px-4 py-2 rounded-full">
                    Нет в наличии
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden transition-all duration-150 cursor-pointer"
                    style={{
                      outline: i === imgIdx ? `2px solid ${accentColor}` : "2px solid transparent",
                      outlineOffset: "1px",
                      opacity: i === imgIdx ? 1 : 0.55,
                    }}
                    aria-label={`Фото ${i + 1}`}
                    aria-pressed={i === imgIdx}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col p-5 gap-4">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-[#f5f0e8] leading-tight">{product.name}</h2>
              <p className="text-2xl font-bold mt-2 tabular-nums" style={{ color: accentColor }}>
                {formatPrice(product.price)} ₸
              </p>
            </div>

            {product.description && (
              <p className="text-sm text-[#888880] leading-relaxed">{product.description}</p>
            )}

            {/* Variants */}
            {product.options.length > 0 && (
              <div className="space-y-4">
                {product.options.map((opt) => (
                  <div key={opt.name}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-semibold text-[#f5f0e8]">{opt.name}</p>
                      {selected[opt.name] ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: accentColor + "20", color: accentColor }}>
                          {selected[opt.name]}
                        </span>
                      ) : (
                        <span className="text-xs text-[#555]">не выбрано</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val) => {
                        const isActive = selected[opt.name] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSelected((prev) => ({ ...prev, [opt.name]: val }))}
                            className="relative h-9 px-4 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer active:scale-95 min-w-[44px]"
                            style={
                              isActive
                                ? { background: accentColor + "18", borderColor: accentColor, color: accentColor }
                                : { background: "#1a1a1a", borderColor: "#2a2a2a", color: "#888880" }
                            }
                            aria-pressed={isActive}
                          >
                            {isActive && (
                              <span className="absolute top-1 right-1 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: accentColor }}>
                                <Check size={8} className="text-[#0d0d0d]" strokeWidth={3} />
                              </span>
                            )}
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!allSelected && missingOptions.length > 0 && (
                  <p className="text-xs text-[#555]">
                    Выберите: {missingOptions.map((o) => o.name).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Action */}
            <div className="mt-auto pt-2 space-y-3">
              {qty > 0 && allSelected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDecrease}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform cursor-pointer"
                      style={{ background: accentColor }}
                      aria-label="Убрать"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-xl font-bold text-[#f5f0e8] tabular-nums">{qty}</span>
                    <button
                      onClick={handleIncrease}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-[#0d0d0d] active:scale-95 transition-transform cursor-pointer"
                      style={{ background: accentColor }}
                      aria-label="Добавить ещё"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-sm text-[#666660]">в корзине</span>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className="w-full h-12 rounded-2xl font-bold text-[#0d0d0d] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: canAdd ? accentColor : "#2a2a2a",
                    boxShadow: canAdd ? `0 4px 20px ${accentColor}40` : "none",
                  }}
                >
                  {addedPulse ? (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Добавлено
                    </>
                  ) : !product.in_stock ? (
                    "Нет в наличии"
                  ) : !allSelected ? (
                    `Выберите ${missingOptions[0]?.name}`
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      В корзину
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
