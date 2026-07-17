import type { ReactNode } from "react";
import { BackButton } from "@/components/shared/back-button";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { DemoDataBadge } from "@/components/shared/demo-data-badge";

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  backLabel = "Back",
  status,
  demoBadge = true,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  status?: ReactNode;
  demoBadge?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        {backHref ? <BackButton href={backHref}>{backLabel}</BackButton> : null}
        <div className="page-header-title-row">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {status ? <div className="page-header-status">{status}</div> : null}
        </div>
      </div>
      <div className="page-header-actions">
        {demoBadge ? <DemoDataBadge /> : null}
        {actions}
      </div>
    </header>
  );
}
