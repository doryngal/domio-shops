"use client";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus, Trash2, MessageCircle } from "lucide-react";

interface CartDrawerProps {
  shopSlug: string;
  whatsappNumber: string;
  accentColor?: string;
  whatsappTemplate?: string | null;
}

export function CartDrawer({ shopSlug, whatsappNumber, accentColor = "#C9A84C", whatsappTemplate }: CartDrawerProps) {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, total, count, sessionId } = useCart();

  const handleWhatsApp = async () => {
    if (items.length === 0) return;

    const lines = items
      .map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)} ₸`)
      .join("\n");

    let message: string;
    if (whatsappTemplate) {
      message = whatsappTemplate
        .replace("{{items}}", lines)
        .replace("{{total}}", `${formatPrice(total)} ₸`);
    } else {
      message = `Привет! Хочу заказать:\n${lines}\nИтого: ${formatPrice(total)} ₸`;
    }

    // Log order event
    await fetch(`/api/storefront/${shopSlug}/events/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        product_ids: items.map((i) => i.id),
        cart_total: total,
      }),
    }).catch(() => {});

    const wa = whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[#141414] border-l border-[#2a2a2a] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="font-semibold text-[#f5f0e8] text-lg">
            Корзина{" "}
            {count > 0 && (
              <span className="text-sm text-[#888880]">({count})</span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[#888880] hover:text-[#f5f0e8] hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[#888880]">
              <p className="text-4xl mb-3">🛒</p>
              <p>Корзина пуста</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-[#1a1a1a] rounded-xl p-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#f5f0e8] font-medium truncate">{item.name}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: accentColor }}>
                    {formatPrice(item.price * item.quantity)} ₸
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#333] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Уменьшить"
                    >
                      <Minus size={14} className="text-[#f5f0e8]" />
                    </button>
                    <span className="text-sm text-[#f5f0e8] w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#333] flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Увеличить"
                    >
                      <Plus size={14} className="text-[#f5f0e8]" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto p-1 text-[#888880] hover:text-red-400 transition-colors cursor-pointer"
                      aria-label="Удалить"
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
          <div className="p-4 border-t border-[#2a2a2a] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#888880]">Итого</span>
              <span className="text-xl font-bold text-[#f5f0e8]">{formatPrice(total)} ₸</span>
            </div>
            <button
              onClick={handleWhatsApp}
              className="w-full py-4 rounded-xl font-bold text-[#0d0d0d] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 cursor-pointer text-base"
              style={{ background: accentColor }}
            >
              <MessageCircle size={20} />
              Заказать в WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
}
