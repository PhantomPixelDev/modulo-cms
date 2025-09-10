import { Button } from "./button";
import { Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  editLabel?: string;
  deleteLabel?: string;
  viewLabel?: string;
}

export function ActionButtons({
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = false,
  size = "sm",
  className = "",
  editLabel = "Edit",
  deleteLabel = "Delete",
  viewLabel = "View",
}: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showView && onView && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={onView}
          className="text-muted-foreground hover:text-primary"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">{viewLabel}</span>
        </Button>
      )}
      {showEdit && onEdit && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={onEdit}
          className="text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{editLabel}</span>
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{deleteLabel}</span>
        </Button>
      )}
    </div>
  );
}
