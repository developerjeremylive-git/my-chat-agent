import { Tooltip } from "@/components/tooltip/Tooltip";
import { cn } from "@/lib/utils";

type ToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  tooltip?: string;
  "aria-label"?: string;
  icon?: React.ReactNode;
  size?: "sm" | "base" | "lg";
};

export const Toggle = ({ pressed, onPressedChange, tooltip, "aria-label": ariaLabel, icon, size = "base" }: ToggleProps) => {
  return (
    <Tooltip content={tooltip || ""}>
      <button
        type="button"
        className={cn(
          "ob-focus interactive dark:bg-neutral-750 bg-neutral-250 cursor-pointer rounded-full border border-transparent p-1 transition-colors hover:bg-neutral-300 dark:hover:bg-neutral-700",
          {
            "h-5.5 w-8.5": size === "sm",
            "h-6.5 w-10.5": size === "base",
          "h-7.5 w-12.5": size === "lg",
          "dark:hover:bg-neutral-450 bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-500":
            pressed,
        }
      )}
      onClick={() => onPressedChange(!pressed)}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "aspect-square h-full rounded-full bg-white transition-all",
          {
            "translate-x-full": pressed,
          }
        )}
      />
        {icon}
      </button>
    </Tooltip>
  );
};
