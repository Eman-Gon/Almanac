"use client";

import { AlertTriangle, CheckCircle2, Clock3, MessageSquare, PhoneCall, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { DemoDataBadge } from "@/components/shared/demo-data-badge";
import { Panel } from "@/components/shared/panel";
import { donation, donor } from "@/data/seed/scenario";
import {
  CommunicationResultSchema,
  type CommunicationChannel,
  type CommunicationResult,
} from "@/domain/communications/vapi";

const defaultMessage = "Hi, this is ChoiceGrid calling about an urgent strawberry donation update. Please confirm who is the receiving contact and whether your team can respond as soon as possible. No allocation changes are being made by this message.";
const defaultVoicemailMessage = "Hi, this is ChoiceGrid with an urgent donation update. Please call back using the number displayed on your phone and reference DON-104. No allocation has been finalized.";

const ResponseSchema = z.object({
  data: CommunicationResultSchema.nullable(),
  error: z.object({ message: z.string() }).nullable(),
});

type FormState = {
  channel: CommunicationChannel;
  contactName: string;
  toE164: string;
  message: string;
  voicemailMessage: string;
};

const initialForm: FormState = {
  channel: "voice",
  contactName: "Synthetic receiving contact",
  toE164: "",
  message: defaultMessage,
  voicemailMessage: defaultVoicemailMessage,
};

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isTerminalStatus(status: string): boolean {
  return ["ended", "failed", "error", "completed"].includes(status.toLowerCase());
}

export function CommunicationCenter() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CommunicationResult | null>(null);
  const [providerStatus, setProviderStatus] = useState<string | null>(null);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setResult(null);
    setProviderStatus(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      setError("Confirm that you are authorized to contact this test number and approve the exact message.");
      return;
    }
    if (!form.toE164.trim()) {
      setError("Enter a test number in E.164 format before placing the call.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/communications/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: form.channel,
          contactName: form.contactName,
          toE164: form.toE164,
          message: form.message,
          voicemailMessage: form.channel === "voice" ? form.voicemailMessage : undefined,
          referenceId: donation.id,
          confirmed: true,
        }),
      });
      const payload = ResponseSchema.safeParse(await response.json().catch(() => null));
      if (!payload.success) throw new Error("The communication response was invalid.");
      if (!response.ok || !payload.data.data) throw new Error(payload.data.error?.message ?? "The communication request failed.");
      setResult(payload.data.data);
      setProviderStatus(payload.data.data.status);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The communication request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const communicationId = result?.communicationId ?? "";
  const shouldPoll = result?.mode === "live" && result.channel === "voice" && communicationId.length > 0;

  useEffect(() => {
    if (!shouldPoll) return;
    let stopped = false;
    let timer: number | undefined;

    async function pollStatus() {
      try {
        const response = await fetch(`/api/communications/status/${encodeURIComponent(communicationId)}`);
        const payload = ResponseSchema.safeParse(await response.json().catch(() => null));
        if (!stopped && payload.success && payload.data.data) {
          const nextStatus = payload.data.data.status;
          setProviderStatus(nextStatus);
          if (!isTerminalStatus(nextStatus)) timer = window.setTimeout(pollStatus, 3_500);
        } else if (!stopped) {
          timer = window.setTimeout(pollStatus, 5_000);
        }
      } catch {
        if (!stopped) timer = window.setTimeout(pollStatus, 5_000);
      }
    }

    timer = window.setTimeout(pollStatus, 3_000);
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [communicationId, shouldPoll]);

  return (
    <div className="communications-page-content">
      <div className="communication-guardrail">
        <ShieldCheck size={21} aria-hidden="true" />
        <div>
          <strong>Human-approved communication only</strong>
          <span>ChoiceGrid will not accept food, change an allocation, certify safety, or dispatch a mission from this call.</span>
        </div>
        <DemoDataBadge />
      </div>

      <div className="communication-layout">
        <Panel title="Send a test update" action={<span className="panel-meta-label">Vapi test center</span>}>
          <form className="communication-form" onSubmit={submit}>
            <div className="communication-channel-group" aria-label="Communication channel">
              <span className="field-label">Channel</span>
              <div className="communication-channel-options">
                <label className={`communication-channel-option ${form.channel === "voice" ? "communication-channel-selected" : ""}`}>
                  <input type="radio" name="channel" value="voice" checked={form.channel === "voice"} onChange={() => update("channel", "voice")} />
                  <PhoneCall size={17} aria-hidden="true" />
                  <span><strong>Voice call</strong><small>Detect voicemail and leave the approved message.</small></span>
                </label>
                <label className={`communication-channel-option ${form.channel === "sms" ? "communication-channel-selected" : ""}`}>
                  <input type="radio" name="channel" value="sms" checked={form.channel === "sms"} onChange={() => update("channel", "sms")} />
                  <MessageSquare size={17} aria-hidden="true" />
                  <span><strong>SMS message</strong><small>Send the exact approved text through Vapi.</small></span>
                </label>
              </div>
            </div>

            <div className="communication-form-grid">
              <label className="field">
                <span>Test contact name</span>
                <input value={form.contactName} onChange={(event) => update("contactName", event.target.value)} />
              </label>
              <label className="field">
                <span>Test number (E.164)</span>
                <input type="tel" inputMode="tel" autoComplete="tel" value={form.toE164} onChange={(event) => update("toE164", event.target.value)} placeholder="+14155550123" />
              </label>
            </div>

            <label className="field">
              <span>Approved message</span>
              <textarea rows={5} required maxLength={500} value={form.message} onChange={(event) => update("message", event.target.value)} />
              <small>Facts are entered by staff; the communication agent does not invent operational details.</small>
            </label>

            {form.channel === "voice" ? (
              <label className="field">
                <span>Voicemail message</span>
                <textarea rows={3} required maxLength={1_000} value={form.voicemailMessage} onChange={(event) => update("voicemailMessage", event.target.value)} />
              </label>
            ) : null}

            <label className="communication-confirmation">
              <input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); setError(""); }} />
              <span>I am authorized to contact this test number and approve this exact message.</span>
            </label>

            {error ? <div className="form-error" role="alert"><AlertTriangle size={16} aria-hidden="true" />{error}</div> : null}

            <div className="communication-form-actions">
              <button className="button button-primary" type="submit" disabled={submitting}>
                {form.channel === "voice" ? <PhoneCall size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                {submitting ? "Requesting…" : form.channel === "voice" ? "Place test call" : "Send test SMS"}
              </button>
              <span>Live calls require an explicitly enabled Vapi test configuration.</span>
            </div>
          </form>
        </Panel>

        <div className="communication-side-column">
          <Panel title="Approved context">
            <dl className="communication-facts">
              <div><dt>Scenario</dt><dd>{donation.id} · Strawberry Rescue</dd></div>
              <div><dt>Donor</dt><dd>{donor.name}</dd></div>
              <div><dt>Urgency signal</dt><dd>Pickup before 1:00 PM</dd></div>
              <div><dt>Purpose</dt><dd>Confirm receiving contact and request an ASAP response</dd></div>
            </dl>
            <div className="communication-side-note">Real partner contacts are not seeded. Use a number you control for testing.</div>
          </Panel>

          {result ? (
            <Panel title="Request result">
              <div className={`communication-result communication-result-${result.mode}`} role="status" aria-live="polite">
                {result.mode === "live" ? <CheckCircle2 size={19} aria-hidden="true" /> : <Clock3 size={19} aria-hidden="true" />}
                <div>
                  <strong>{result.mode === "live" ? "Vapi request accepted" : "Preview only — nothing sent"}</strong>
                  <span>{result.channel === "voice" ? "Voice call" : "SMS message"} · {result.toMasked ?? "recipient hidden"}</span>
                  {result.mode === "live" && providerStatus ? <span className="communication-provider-status">Provider status: {statusLabel(providerStatus)}</span> : null}
                  {result.communicationId ? <small>Request ID: {result.communicationId}</small> : null}
                  {result.note ? <small>{result.note}</small> : null}
                  {result.mode === "preview" ? <small>Set VAPI_TEST_CALLS_ENABLED=true with the approved test number to enable a live request.</small> : null}
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
