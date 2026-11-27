import {
  Building, Car, Film, Gift, GraduationCap, HeartPulse, Home, Laptop, MoreHorizontal,
  Plane, Plus, Receipt, Shield, ShoppingBag, ShoppingCart, Smile, TrendingUp,
  UtensilsCrossed, Wallet, Zap, Tag,
} from "lucide-react";
import { defaultCategories } from "@/data/categories";
import { cn } from "@/lib/utils";

const ICONS = {
  Building, Car, Film, Gift, GraduationCap, HeartPulse, Home, Laptop, MoreHorizontal,
  Plane, Plus, Receipt, Shield, Shopping: ShoppingCart, ShoppingBag, Smile, TrendingUp,
  UtensilsCrossed, Wallet, Zap,
};

const BY_ID = Object.fromEntries(defaultCategories.map((c) => [c.id, c]));

export function getCategory(id) {
  return (
    BY_ID[id] || {
      id,
      name: id ? id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ") : "Uncategorized",
      color: "#94a3b8",
      icon: null,
    }
  );
}

export function CategoryIcon({ category, className }) {
  const c = getCategory(category);
  const Icon = ICONS[c.icon] || Tag;
  return (
    <span
      className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full", className)}
      style={{ backgroundColor: `${c.color}1f`, color: c.color }}
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
