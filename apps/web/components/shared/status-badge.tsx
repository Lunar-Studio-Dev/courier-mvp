import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const statusStyles: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  PICKED_UP: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  IN_TRANSIT:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  OUT_FOR_DELIVERY:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  DELIVERED:
    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  RETURNED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  CANCELLED:
    "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        statusStyles[status] ?? statusStyles.BOOKED,
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
