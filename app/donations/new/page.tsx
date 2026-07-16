"use client";

import { useRouter } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/shared/panel";
import { donation, donor } from "@/data/seed/scenario";

const ParseResponseSchema = z.object({
  data: z.object({
    fallbackUsed: z.boolean(),
    execution: z.object({
      source: z.enum(["primary_model", "backup_model", "deterministic_fallback"]),
      model: z.string().min(1),
    }),
  }),
});

const DonationDraftSchema = z.object({
  donor: z.string(),
  message: z.string(),
  product: z.string(),
  quantity: z.string(),
  location: z.string(),
  pickupWindow: z.string(),
  storage: z.string(),
  conditionNotes: z.string(),
});

type DonationDraft = z.infer<typeof DonationDraftSchema>;

const DONATION_DRAFT_STORAGE_KEY = "choicegrid:donation-intake-draft:v1";

const emptyForm: DonationDraft = {
  donor: "",
  message: "",
  product: "",
  quantity: "",
  location: "",
  pickupWindow: "",
  storage: "",
  conditionNotes: "",
};

function loadDonationDraft(): DonationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const savedDraft = window.localStorage.getItem(DONATION_DRAFT_STORAGE_KEY);
    if (!savedDraft) return null;
    const parsedDraft = DonationDraftSchema.safeParse(JSON.parse(savedDraft));
    if (parsedDraft.success) return parsedDraft.data;
    window.localStorage.removeItem(DONATION_DRAFT_STORAGE_KEY);
  } catch {
    // Browser storage may be disabled or contain an invalid draft.
  }
  return null;
}

export default function DonationIntakePage() {
  const router = useRouter();
  const [form, setForm] = useState<DonationDraft>(
    () => loadDonationDraft() ?? emptyForm,
  );
  const [error, setError] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [parsing, setParsing] = useState(false);

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setDraftStatus("");
  }

  function loadDemo() {
    setForm({
      donor: donor.name,
      message: donation.sourceText,
      product: donation.productDescription,
      quantity: String(donation.quantityLb),
      location: `${donor.location.address}, ${donor.location.city}`,
      pickupWindow: "Today before 1:00 PM",
      storage: "Refrigerated",
      conditionNotes: donation.conditionNotes ?? "",
    });
    setError("");
    setDraftStatus("");
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(
        DONATION_DRAFT_STORAGE_KEY,
        JSON.stringify(form),
      );
      setError("");
      setDraftStatus("Draft saved locally in demo mode.");
    } catch {
      setDraftStatus("");
      setError("The local draft could not be saved in this browser.");
    }
  }

  function clearForm() {
    setForm(emptyForm);
    setError("");
    setDraftStatus("");
    try {
      window.localStorage.removeItem(DONATION_DRAFT_STORAGE_KEY);
    } catch {
      // The form can still be cleared when browser storage is unavailable.
    }
  }

  async function parseOffer() {
    if (!form.message.trim() && (!form.product.trim() || Number(form.quantity) <= 0)) {
      setError("Enter a donor message or complete the product and positive quantity fields.");
      return;
    }

    const sourceText = form.message.trim() || [
      `${form.product.trim()}, ${form.quantity} pounds.`,
      form.pickupWindow.trim(),
      form.storage.trim(),
      form.conditionNotes.trim(),
    ].filter(Boolean).join(" ");

    setParsing(true);
    setError("");
    try {
      const response = await fetch("/api/donations/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceText, donorId: donor.id }),
      });
      const payload = ParseResponseSchema.safeParse(await response.json());
      if (!response.ok) throw new Error("Donation parsing failed.");
      if (!payload.success) throw new Error("Donation parsing returned an invalid response.");
      const query = new URLSearchParams({
        intake: payload.data.data.execution.source,
        model: payload.data.data.execution.model,
      });
      router.push(`/donations/DON-104?${query.toString()}`);
    } catch {
      setError("The offer could not be parsed. Check the server and try again.");
      setParsing(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New donation"
        subtitle="Capture an offer without turning uncertain details into operational facts."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Donations", href: "/donations" }, { label: "New donation" }]}
        backHref="/donations"
        backLabel="Back to Donations"
      />
      <div className="page-content intake-page">
        <Panel title="Offer details" className="form-panel">
          <div className="form-intro">
            <FileText size={20} aria-hidden="true" />
            <p>Paste the original donor message. ChoiceGrid keeps it visible beside the validated extraction.</p>
            <button className="button button-secondary" type="button" onClick={loadDemo}><Sparkles size={15} aria-hidden="true" />Load demo offer</button>
          </div>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); parseOffer(); }}>
            <label className="field field-span-2">
              <span>Donor message or description</span>
              <textarea rows={6} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Paste the donor's original message…" />
            </label>
            <label className="field">
              <span>Donor</span>
              <input value={form.donor} onChange={(event) => update("donor", event.target.value)} placeholder="Select or enter donor" />
            </label>
            <label className="field">
              <span>Product</span>
              <input value={form.product} onChange={(event) => update("product", event.target.value)} placeholder="e.g. Strawberries" />
            </label>
            <label className="field">
              <span>Quantity (lb)</span>
              <input type="number" min="0" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="0" />
            </label>
            <label className="field">
              <span>Pickup window</span>
              <input value={form.pickupWindow} onChange={(event) => update("pickupWindow", event.target.value)} placeholder="e.g. Today before 1:00 PM" />
            </label>
            <label className="field field-span-2">
              <span>Pickup location</span>
              <input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Unknown locations remain marked for confirmation" />
            </label>
            <label className="field">
              <span>Storage requirement</span>
              <select value={form.storage} onChange={(event) => update("storage", event.target.value)}>
                <option value="">Needs confirmation</option>
                <option>Ambient</option>
                <option>Refrigerated</option>
                <option>Frozen</option>
              </select>
            </label>
            <label className="field">
              <span>Condition notes</span>
              <input value={form.conditionNotes} onChange={(event) => update("conditionNotes", event.target.value)} placeholder="Advisory only; staff inspection required" />
            </label>
            {error ? <div className="form-error field-span-2" role="alert">{error}</div> : null}
            {draftStatus ? <div className="form-status field-span-2" role="status">{draftStatus}</div> : null}
            <div className="form-actions field-span-2">
              <button className="button button-ghost" type="button" onClick={clearForm}>Clear</button>
              <button className="button button-secondary" type="button" onClick={saveDraft}>Save draft</button>
              <button className="button button-primary" type="submit" disabled={parsing}>
                {parsing ? "Parsing offer…" : "Parse offer"}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
