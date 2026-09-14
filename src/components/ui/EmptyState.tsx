import { CircleDashed } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><CircleDashed aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{action}</div>;
}
