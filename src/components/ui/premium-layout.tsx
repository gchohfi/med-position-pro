import React from "react";
import { cn } from "@/lib/utils";

/* ── PageHeader ── Premium page title + subtitle */
interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="space-y-1 min-w-0">
        <h1 className="font-heading text-title tracking-tight text-foreground flex items-center gap-2.5">
          {icon && <span className="text-accent shrink-0">{icon}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 pt-0.5">{actions}</div>}
    </div>
  );
}

/* ── SectionBlock ── Consistent section wrapper */
interface SectionBlockProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function SectionBlock({ label, children, className, compact }: SectionBlockProps) {
  return (
    <section className={cn(compact ? "space-y-3" : "space-y-4", className)}>
      {label && (
        <h3 className="text-label uppercase tracking-wider text-muted-foreground/70">
          {label}
        </h3>
      )}
      {children}
    </section>
  );
}

/* ── PremiumCard ── Elevated card surface */
interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function PremiumCard({ children, className, active, hoverable, padding = "md" }: PremiumCardProps) {
  const paddings = { sm: "p-3.5", md: "p-5", lg: "p-6" };
  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-premium transition-all duration-200",
        hoverable && "hover:shadow-premium-md hover:border-accent/20 cursor-pointer",
        active && "border-accent/40 shadow-premium-md ring-1 ring-accent/10",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── EmptyState ── Premium empty placeholder */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-muted-foreground/30">{icon}</div>}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle && <p className="text-[13px] text-muted-foreground/60 mt-1 max-w-sm">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── MetricPill ── Compact inline metric */
interface MetricPillProps {
  label: string;
  value: string | number;
  className?: string;
}

export function MetricPill({ label, value, className }: MetricPillProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-[11px]", className)}>
      <span className="text-muted-foreground/60">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
