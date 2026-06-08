import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm text-[#888880] leading-tight">{label}</span>
        {icon && (
          <span className="text-[#C9A84C] w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-[#C9A84C]/10 flex-shrink-0">
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl md:text-3xl font-bold text-[#f5f0e8] tabular-nums">{value}</span>
      {sub && <span className="text-[10px] md:text-xs text-[#888880]">{sub}</span>}
    </Card>
  );
}
