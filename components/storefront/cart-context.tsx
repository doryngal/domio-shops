"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { generateSessionId } from "@/lib/utils";

export interface CartVariant {
  name: string;   // "Размер"
  value: string;  // "M"
}

export interface CartItem {
  cartKey: string;       // id + JSON variants — unique per combination
  id: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  variants: CartVariant[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "cartKey">) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  sessionId: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

function makeCartKey(id: string, variants: CartVariant[]): string {
  if (!variants.length) return id;
  return id + "|" + variants.map((v) => `${v.name}:${v.value}`).join(",");
}

export function CartProvider({ children, shopSlug }: { children: React.ReactNode; shopSlug: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = `cart_${shopSlug}`;
    const sid = localStorage.getItem("session_id") || generateSessionId();
    localStorage.setItem("session_id", sid);
    setSessionId(sid);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // migrate old items that don't have cartKey/variants
        const migrated = parsed.map((i: any) => ({
          ...i,
          cartKey: i.cartKey ?? i.id,
          variants: i.variants ?? [],
        }));
        setItems(migrated);
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, [shopSlug]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(`cart_${shopSlug}`, JSON.stringify(items));
  }, [items, shopSlug, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "cartKey">) => {
    const cartKey = makeCartKey(item.id, item.variants);
    setItems((prev) => {
      const exists = prev.find((i) => i.cartKey === cartKey);
      if (exists) {
        return prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartKey, quantity: 1 }];
    });

    fetch(`/api/storefront/${shopSlug}/events/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, product_id: item.id, page: "cart" }),
    }).catch(() => {});
  }, [shopSlug, sessionId]);

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
    } else {
      setItems((prev) => prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count, sessionId, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
