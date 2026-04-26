import { scoreColor } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  const { bg, text, label } = scoreColor(score);
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };
  const display = score == null ? "?" : `${score}/10`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold",
        bg,
        text,
        sizeClasses[size],
        className,
      )}
      title={`${label} lead`}
    >
      {display}
    </span>
  );
}
