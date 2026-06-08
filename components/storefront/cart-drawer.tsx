"use client";
import { useCart } from "./cart-context";
import { useDragDismiss } from "@/hooks/use-drag-dismiss";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus, Trash2, MessageCircle, ShoppingBag } from "lucide-react";

interface CartDrawerProps {
  shopSlug: string;
  whatsappNumber: string;
  accentColor?: string;
  whatsappTemplate?: string | null;
}

export function CartDrawer({ shopSlug, whatsappNumber, accentColor = "#C9A84C", whatsappTemplate }: CartDrawerProps) {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, total, count, sessionId } = useCart();
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useDragDismiss({ onClose: () => setIsOpen(false) });

  const handleWhatsApp = async () => {
    if (items.length === 0) return;
    const lines = items.map((i) => {
      const varStr = i.variants.length
        ? ` (${i.variants.map((v) => `${v.name}: ${v.value}`).join(", ")})`
        : "";
      return `• ${i.name}${varStr} x${i.quantity} — ${formatPrice(i.price * i.quantity)} ₸`;
    }).join("\n");

    const message = whatsappTemplate
      ? whatsappTemplate.replace("{{items}}", lines).replace("{{total}}", `${formatPrice(total)} ₸`)
      : `Привет! Хочу заказать:\n${lines}\nИтого: ${formatPrice(total)} ₸`;

    await fetch(`/api/storefront/${shopSlug}/events/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, product_ids: items.map((i) => i.id), cart_total: total }),
    }).catch(() => {});

    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-all duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile positioning wrapper — centers the island, handles open/close translate */}
      {/* On desktop this wrapper is transparent; the inner div does all desktop layout */}
      <div
        className={`fixed z-50
          md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[400px]
          max-md:left-0 max-md:right-0 max-md:bottom-4 max-md:flex max-md:justify-center max-md:px-4 max-md:pointer-events-none
          transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isOpen ? "max-md:translate-y-0 md:translate-x-0" : "max-md:translate-y-[calc(100%+32px)] md:translate-x-full"}`}
      >
      {/* Inner sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        className={`bg-[#141414] flex flex-col
          md:h-full md:border-l md:border-[#222] md:w-full
          max-md:pointer-events-auto max-md:w-full max-md:max-w-[480px] max-md:rounded-3xl max-md:border max-md:border-[#2a2a2a] max-md:max-h-[85dvh]`}
        style={{ boxShadow: "0 -4px 60px rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.4)" }}
      >
        {/* Mobile handle — drag zone */}
        <div
          className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0 touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-hidden="true"
        >
          <div className="w-9 h-1 rounded-full bg-[#444]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} className="text-[#f5f0e8]" />
            <h2 className="font-bold text-[#f5f0e8] text-base">
              Корзина
              {count > 0 && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold text-[#0d0d0d]"
                  style={{ background: accentColor }}
                >
                  {count}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full bg-[#1f1f1f] flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            aria-label="Закрыть корзину"
          >
            <X size={17} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-center py-10">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <ShoppingBag size={28} className="text-[#333]" />
              </div>
              <div>
                <p className="text-[#f5f0e8] font-medium">Корзина пуста</p>
                <p className="text-xs text-[#555] mt-1">Добавьте товары из каталога</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartKey}
                className="flex gap-3 bg-[#1a1a1a] rounded-2xl p-3 group"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-[68px] h-[68px] rounded-xl bg-[#252525] flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={20} className="text-[#333]" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="text-sm text-[#f5f0e8] font-semibold leading-snug line-clamp-1">{item.name}</p>
                    {item.variants.length > 0 && (
                      <p className="text-[11px] text-[#555] mt-0.5">
                        {item.variants.map((v) => `${v.name}: ${v.value}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: accentColor }}>
                      {formatPrice(item.price * item.quantity)} ₸
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-[#252525] rounded-xl p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] transition-colors cursor-pointer active:scale-90"
                        aria-label="Уменьшить"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="text-sm text-[#f5f0e8] font-bold w-7 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] transition-colors cursor-pointer active:scale-90"
                        aria-label="Увеличить"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#444] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer active:scale-90"
                      aria-label="Удалить из корзины"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-[#1f1f1f] space-y-3 flex-shrink-0">
            {/* Total row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#666660]">Итого · {count} {count === 1 ? "товар" : count < 5 ? "товара" : "товаров"}</span>
              <span className="text-xl font-bold text-[#f5f0e8] tabular-nums">{formatPrice(total)} ₸</span>
            </div>

            {/* WhatsApp button */}
            <button
              onClick={handleWhatsApp}
              className="w-full h-13 py-3.5 rounded-2xl font-bold text-[#0d0d0d] flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer active:scale-[0.98] text-base"
              style={{
                background: accentColor,
                boxShadow: `0 4px 24px ${accentColor}50`,
              }}
            >
              <MessageCircle size={20} />
              Заказать в WhatsApp
            </button>

            <p className="text-[10px] text-[#444] text-center">
              Откроется WhatsApp с готовым заказом
            </p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
