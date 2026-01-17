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
  Hamburger,
  Repeat2,
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
  Hamburger,
  Repeat2,
};

// Helper to detect if a string contains emoji characters
const isEmoji = (str: string): boolean => {
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u;
  return emojiRegex.test(str);
};

export const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  // Handle HTTP URLs or local paths
  if (name.startsWith("http") || name.startsWith("/")) {
    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`}>
        <img src={name} alt="icon" className="w-full h-full object-cover" />
      </div>
    );
  }

  // Handle emoji strings
  if (isEmoji(name)) {
    return <span className={className}>{name}</span>;
  }

  // Handle Lucide icon names
  const Icon = iconMap[name] || CircleHelp;
  return <Icon className={className} />;
};
