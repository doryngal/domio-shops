"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  shopName?: string;
  logoHref?: string;
}

export function Sidebar({ items, shopName, logoHref = "/" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#141414] border-r border-[#2a2a2a] flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[#2a2a2a]">
        <Link href={logoHref} className="flex items-center gap-2">
          <span className="text-[#C9A84C] font-bold text-xl">Domio</span>
          <span className="text-[#f5f0e8] font-bold text-xl">Shops</span>
        </Link>
        {shopName && (
          <p className="text-xs text-[#888880] mt-1 truncate">{shopName}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                active
                  ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20"
                  : "text-[#888880] hover:text-[#f5f0e8] hover:bg-[#1a1a1a]"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#888880] hover:text-red-400 hover:bg-red-500/10 w-full transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  );
}

export const shopNavItems: SidebarItem[] = [
  { href: "/shop/dashboard", label: "Обзор", icon: <LayoutGrid size={18} /> },
  { href: "/shop/dashboard/products", label: "Каталог", icon: <Package size={18} /> },
  { href: "/shop/dashboard/orders", label: "Заказы", icon: <ShoppingBag size={18} /> },
  { href: "/shop/dashboard/analytics", label: "Аналитика", icon: <BarChart3 size={18} /> },
  { href: "/shop/dashboard/settings", label: "Настройки", icon: <Settings size={18} /> },
];

export const founderNavItems: SidebarItem[] = [
  { href: "/founder/dashboard", label: "Обзор", icon: <LayoutGrid size={18} /> },
  { href: "/founder/dashboard/shops", label: "Магазины", icon: <Store size={18} /> },
  { href: "/founder/dashboard/analytics", label: "Аналитика", icon: <BarChart3 size={18} /> },
];
