import {
  Sandwich,
  Utensils,
  Drumstick,
  Pizza,
  CupSoda,
  IceCream,
  Salad,
  Users,
  Baby,
  Banknote,
  Plus,
  ClipboardList,
  Scroll,
  ChefHat,
  CookingPot,
  Wallet,
  LucideIcon,
  CircleHelp,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Sandwich,
  Utensils,
  Drumstick,
  Pizza,
  CupSoda,
  IceCream,
  Salad,
  Users,
  Baby,
  Banknote,
  Plus,
  ClipboardList,
  Scroll,
  ChefHat,
  CookingPot,
  Wallet,
};

export const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  if (name.startsWith("http") || name.startsWith("/")) {
    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`}>
        <img src={name} alt="icon" className="w-full h-full object-cover" />
      </div>
    );
  }

  const Icon = iconMap[name] || CircleHelp;
  return <Icon className={className} />;
};
