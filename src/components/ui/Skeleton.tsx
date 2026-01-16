interface SkeletonProps {
  className?: string;
  variant?: "text" | "title" | "avatar" | "card" | "custom";
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "text",
  lines = 1,
}: SkeletonProps) {
  const variants = {
    text: "h-4 w-full skeleton-text",
    title: "h-6 w-3/4 skeleton-title",
    avatar: "w-12 h-12 rounded-xl skeleton-avatar",
    card: "h-32 w-full",
    custom: "",
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${variants.text} ${
              i === lines - 1 ? "w-2/3" : ""
            } ${className}`}
            role="status"
            aria-label="Loading..."
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${variants[variant]} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="avatar" />
        <div className="flex-1">
          <Skeleton variant="title" />
          <Skeleton className="w-1/2" />
        </div>
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

export function SkeletonOrderCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="avatar" />
          <div>
            <Skeleton variant="title" className="w-24" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
      </div>
      <Skeleton className="w-full h-10 rounded-xl" />
    </div>
  );
}
