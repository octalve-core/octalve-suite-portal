"use client";

import Link from "next/link";
import type React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  LayoutTemplate,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import { Badge, Card, cx } from "./UI";

type Tone = "blue" | "green" | "orange" | "red" | "purple" | "slate";

function toneClass(tone: Tone) {
  return `workspace-list-tone-${tone}`;
}

export function WorkspaceSectionHero({
  eyebrow,
  title,
  subtitle,
  action,
  meta,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <section className="workspace-section-hero">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {meta && <div className="workspace-section-meta">{meta}</div>}
      </div>

      {action && <div className="workspace-section-action">{action}</div>}
    </section>
  );
}

export function WorkspaceStatStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    tone?: Tone;
    icon?: React.ReactNode;
  }>;
}) {
  return (
    <div className="workspace-stat-strip">
      {items.map((item) => (
        <Card key={item.label} className="workspace-stat-strip-card">
          <span className={cx("workspace-stat-strip-icon", toneClass(item.tone ?? "blue"))}>
            {item.icon ?? <Clock3 size={18} />}
          </span>
          <div>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function WorkspaceActionCard({
  title,
  subtitle,
  href,
  icon,
  badge,
  meta,
  action,
  tone = "blue",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
}) {
  const content = (
    <>
      <div className="workspace-action-card-main">
        <span className={cx("workspace-action-card-icon", toneClass(tone))}>
          {icon ?? <FileText size={18} />}
        </span>

        <div>
          <div className="workspace-action-card-title">
            <h3>{title}</h3>
            {badge}
          </div>

          {subtitle && <p>{subtitle}</p>}

          {meta && <div className="workspace-action-card-meta">{meta}</div>}
        </div>
      </div>

      <div className="workspace-action-card-side">
        {action}
        {href && <ArrowRight size={17} />}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="workspace-action-card">
        {content}
      </Link>
    );
  }

  return <div className="workspace-action-card">{content}</div>;
}

export function WorkspaceListPanel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="workspace-list-panel">
      <div className="workspace-list-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>

      <div className="workspace-list-panel-body">{children}</div>
    </Card>
  );
}

export function WorkspaceEmptyPanel({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="workspace-empty-panel">
      <span>{icon ?? <Inbox size={24} />}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </Card>
  );
}

export function WorkspaceMessageCard({
  title,
  message,
  meta,
  badge,
  href,
}: {
  title: string;
  message: string;
  meta?: string;
  badge?: React.ReactNode;
  href?: string;
}) {
  return (
    <WorkspaceActionCard
      href={href}
      title={title}
      subtitle={message}
      icon={<MessageSquareText size={18} />}
      badge={badge}
      meta={meta ? <span>{meta}</span> : undefined}
      tone="purple"
    />
  );
}

export const WorkspaceListIcons = {
  request: <Inbox size={18} />,
  template: <LayoutTemplate size={18} />,
  client: <UserRound size={18} />,
  message: <MessageSquareText size={18} />,
  document: <FileText size={18} />,
  clock: <Clock3 size={18} />,
  check: <CheckCircle2 size={18} />,
};
