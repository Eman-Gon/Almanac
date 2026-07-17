import { MultiItemScenarioClient } from "@/components/inventory/multi-item-scenario-client";
import { PageHeader } from "@/components/layout/page-header";

export default function MultiItemInventoryPreviewPage() {
  return (
    <>
      <PageHeader
        title="Multi-item Warehouse Day"
        subtitle="Triage several independent lots and review one grouped release preview."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inventory", href: "/inventory" },
          { label: "Multi-item preview" },
        ]}
        backHref="/inventory"
        backLabel="Back to Inventory"
        status={<span className="plain-status plain-status-blue">Secondary scenario</span>}
      />
      <MultiItemScenarioClient />
    </>
  );
}
