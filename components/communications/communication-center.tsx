"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DemoDataBadge } from "@/components/shared/demo-data-badge";
import { Panel } from "@/components/shared/panel";
import { ProvenanceTag } from "@/components/shared/provenance";
import { productLot, warehouse } from "@/data/seed/scenario";
import {
  approveVoiceOutreachPreview,
  createVoiceOutreachPreview,
  simulateVoiceOutreach,
  type VoiceOutreachPreview,
} from "@/domain/communications/outreach-simulation";
import { useDemoState } from "@/state/demo-state";
import styles from "@/components/communications/communication-center.module.css";

const defaultApprovalReason =
  "Review how approved allocation facts would be communicated before considering any live outreach.";

type Recipient = VoiceOutreachPreview["recipients"][number];
type Response = VoiceOutreachPreview["responses"][number];

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function outcomeLabel(outcome: Response["outcome"]): string {
  if (outcome === "simulated_declined") return "Synthetic decline";
  if (outcome === "simulated_partial") return "Synthetic partial";
  return "Synthetic acknowledgment";
}

function RecipientPreview({ recipient, sequence }: { recipient: Recipient; sequence: number }) {
  return (
    <article className={styles.recipientCard}>
      <div className={styles.sequence} aria-hidden="true">{sequence}</div>
      <div className={styles.recipientCopy}>
        <div className={styles.recipientHeading}>
          <div>
            <strong>{recipient.partnerName}</strong>
            <span>{recipient.city} · receiving coordinator role</span>
          </div>
          <span className={styles.quantity}>{recipient.plannedQuantityLb.toLocaleString()} lb</span>
        </div>
        <dl className={styles.recipientFacts}>
          <div>
            <dt>Receiving window</dt>
            <dd>{formatTime(recipient.receivingWindow.start)}–{formatTime(recipient.receivingWindow.end)}</dd>
          </div>
          <div>
            <dt>Compatible cold capacity</dt>
            <dd>{recipient.refrigeratedCapacityAvailableLb.toLocaleString()} lb</dd>
          </div>
          <div>
            <dt>Current requested demand</dt>
            <dd>{recipient.requestedDemandLb.toLocaleString()} lb</dd>
          </div>
        </dl>
        <details className={styles.scriptDisclosure}>
          <summary><MessageSquareText size={15} aria-hidden="true" />Review generated voice script</summary>
          <div>
            <p>{recipient.script}</p>
            <span>Drafted only from the approved plan and seeded operational facts.</span>
          </div>
        </details>
      </div>
    </article>
  );
}

function ResponseCard({ response, recipient }: { response: Response; recipient: Recipient }) {
  const responseTone = response.outcome === "simulated_declined"
    ? styles.responseDeclined
    : response.outcome === "simulated_partial"
      ? styles.responsePartial
      : styles.responseAcknowledged;

  return (
    <article className={`${styles.responseCard} ${responseTone}`}>
      <div className={styles.responseHeading}>
        <div>
          <strong>{recipient.partnerName}</strong>
          <span>{outcomeLabel(response.outcome)}</span>
        </div>
        <span className={styles.quantity}>{response.acknowledgedQuantityLb.toLocaleString()} lb</span>
      </div>
      <p>{response.summary}</p>
      <details className={styles.transcriptDisclosure}>
        <summary>Read synthetic transcript</summary>
        <ol>
          {response.transcript.map((turn, index) => (
            <li key={`${turn.speaker}-${index}`}>
              <strong>{turn.speaker === "choicegrid" ? "ChoiceGrid" : "Partner fixture"}</strong>
              <span>{turn.text}</span>
            </li>
          ))}
        </ol>
      </details>
      <div className={styles.responseFooter}>
        <ProvenanceTag derivation="simulated" />
        <span>Unverified · no commitment recorded</span>
      </div>
    </article>
  );
}

function PrerequisiteState({ disrupted }: { disrupted: boolean }) {
  return (
    <Panel title={disrupted ? "Recovery approval required" : "Plan approval required"}>
      <div className={styles.prerequisite}>
        <LockKeyhole size={25} aria-hidden="true" />
        <div>
          <strong>
            {disrupted
              ? "Finish the human-reviewed recovery before drafting new partner messages."
              : "Approve an outbound plan before drafting partner messages."}
          </strong>
          <p>
            The simulator only uses quantities, destinations, and windows from a current
            human-approved plan. It cannot create or approve one.
          </p>
        </div>
        <Link
          className="button button-primary"
          href={disrupted ? "/simulate?mission=MSN-104" : "/plans/PLN-104"}
        >
          {disrupted ? "Review recovery" : "Review outbound plans"}
        </Link>
      </div>
    </Panel>
  );
}

export function CommunicationCenter() {
  const { state } = useDemoState();
  const [authorized, setAuthorized] = useState(false);
  const [approvalReason, setApprovalReason] = useState(defaultApprovalReason);
  const [completedPreview, setCompletedPreview] = useState<VoiceOutreachPreview | null>(null);
  const [error, setError] = useState("");

  const activePlan = state.stage === "recovered"
    ? state.disruption?.recoveryOption ?? null
    : state.stage === "approved"
      ? state.approvedPlan
      : null;
  const previewResult = useMemo(() => {
    if (!activePlan) return { preview: null, error: "" };
    try {
      return { preview: createVoiceOutreachPreview(activePlan), error: "" };
    } catch (previewError) {
      return {
        preview: null,
        error: previewError instanceof Error
          ? previewError.message
          : "The outreach preview could not be created.",
      };
    }
  }, [activePlan]);
  const preview = previewResult.preview;
  const visibleCompletedPreview = completedPreview?.approvedPlanOptionId === activePlan?.id
    ? completedPreview
    : null;

  function runSimulation() {
    if (!preview) return;
    if (!authorized) {
      setError("Confirm that you approve this local simulation and the generated scripts.");
      return;
    }
    if (!approvalReason.trim()) {
      setError("Enter a reason for authorizing the outreach simulation.");
      return;
    }

    try {
      const approved = approveVoiceOutreachPreview(preview, approvalReason);
      setCompletedPreview(simulateVoiceOutreach(approved));
      setError("");
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : "The outreach simulation could not be completed.",
      );
    }
  }

  if (!activePlan) {
    return (
      <div className={styles.page}>
        <div className={styles.guardrail}>
          <ShieldCheck size={21} aria-hidden="true" />
          <div>
            <strong>Simulation only — no calls are placed</strong>
            <span>This isolated experiment never contacts a provider or changes ChoiceGrid state.</span>
          </div>
          <DemoDataBadge />
        </div>
        <PrerequisiteState disrupted={state.stage === "disrupted"} />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className={styles.page}>
        <div className={styles.guardrail}>
          <AlertTriangle size={21} aria-hidden="true" />
          <div>
            <strong>Preview unavailable</strong>
            <span>{previewResult.error}</span>
          </div>
          <DemoDataBadge />
        </div>
      </div>
    );
  }

  const plannedOutreachLb = preview.recipients.reduce(
    (total, recipient) => total + recipient.plannedQuantityLb,
    0,
  );
  const simulatedAcknowledgedLb = visibleCompletedPreview?.responses.reduce(
    (total, response) => total + response.acknowledgedQuantityLb,
    0,
  ) ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.guardrail}>
        <ShieldCheck size={21} aria-hidden="true" />
        <div>
          <strong>Simulation only — no calls are placed</strong>
          <span>
            Generated scripts and synthetic responses stay local to this screen and do
            not change allocations, partners, packing, missions, or audit history.
          </span>
        </div>
        <DemoDataBadge />
      </div>

      <section className={styles.hero} aria-labelledby="outreach-simulation-title">
        <div>
          <span className={styles.eyebrow}><Sparkles size={14} aria-hidden="true" />Voice coordination preview</span>
          <h2 id="outreach-simulation-title">One approval. {preview.recipients.length} simulated partner conversations.</h2>
          <p>
            ChoiceGrid turns the current approved release into consistent, reviewable
            partner scripts, then demonstrates how structured responses could return.
          </p>
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>Recipients</dt><dd>{preview.recipients.length}</dd></div>
          <div><dt>Planned outreach</dt><dd>{plannedOutreachLb.toLocaleString()} lb</dd></div>
          <div><dt>External requests</dt><dd>0</dd></div>
        </dl>
      </section>

      <div className={styles.layout}>
        <main className={styles.mainColumn}>
          <Panel
            title="Approved operational context"
            action={<span className="panel-meta-label">{preview.approvedPlanName}</span>}
          >
            <dl className={styles.contextGrid}>
              <div>
                <WarehouseIcon size={17} aria-hidden="true" />
                <dt>Origin</dt>
                <dd>{warehouse.name}</dd>
                <span>{warehouse.id}</span>
              </div>
              <div>
                <FileCheck2 size={17} aria-hidden="true" />
                <dt>Inventory</dt>
                <dd>{productLot.productName} · {productLot.availableQuantityLb.toLocaleString()} lb</dd>
                <span>{productLot.id} · {productLot.temperatureClass}</span>
              </div>
              <div>
                <Clock3 size={17} aria-hidden="true" />
                <dt>Modeled risk deadline</dt>
                <dd>{formatDateTime(preview.riskDeadline)}</dd>
                <span>Seeded scenario fact</span>
              </div>
            </dl>
          </Panel>

          <Panel
            title="Approved recipient queue"
            action={<span className="panel-meta-label">Parallel preview · no delivery</span>}
          >
            <div className={styles.recipientList}>
              {preview.recipients.map((recipient, index) => (
                <RecipientPreview
                  key={recipient.partnerId}
                  recipient={recipient}
                  sequence={index + 1}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Authorize the local simulation">
            <div className={styles.approvalBlock}>
              <label className={styles.reasonField}>
                <span>Reason for preview authorization</span>
                <textarea
                  rows={3}
                  maxLength={240}
                  value={approvalReason}
                  onChange={(event) => {
                    setApprovalReason(event.target.value);
                    setError("");
                    setCompletedPreview(null);
                  }}
                />
              </label>
              <label className={styles.confirmation}>
                <input
                  type="checkbox"
                  checked={authorized}
                  onChange={(event) => {
                    setAuthorized(event.target.checked);
                    setError("");
                  }}
                />
                <span>
                  I approve these exact scripts for a local simulation. I understand
                  that no agency or provider will be contacted.
                </span>
              </label>
              {error ? (
                <div className={styles.error} role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  {error}
                </div>
              ) : null}
              <div className={styles.actions}>
                <button className="button button-primary" type="button" onClick={runSimulation}>
                  <PhoneCall size={16} aria-hidden="true" />
                  Run simulated outreach
                </button>
                <span>Ruleset {preview.modelOrRuleset} · route-local state only</span>
              </div>
            </div>
          </Panel>
        </main>

        <aside className={styles.sideColumn} aria-label="Outreach simulation status">
          <Panel title="What this preview can do">
            <ul className={styles.guardrailList}>
              <li><CheckCircle2 size={16} aria-hidden="true" />Personalize scripts from approved facts.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" />Return strict structured synthetic responses.</li>
              <li><CheckCircle2 size={16} aria-hidden="true" />Show the exact facts used for each recipient.</li>
              <li><LockKeyhole size={16} aria-hidden="true" />Never reserve pounds or change the mission.</li>
              <li><LockKeyhole size={16} aria-hidden="true" />Never use phone numbers, microphones, or provider APIs.</li>
            </ul>
          </Panel>

          {visibleCompletedPreview ? (
            <>
              <Panel title="Simulation result">
                <div className={styles.resultSummary} role="status" aria-live="polite">
                  <CheckCircle2 size={21} aria-hidden="true" />
                  <div>
                    <strong>{visibleCompletedPreview.responses.length} synthetic responses created</strong>
                    <span>
                      {simulatedAcknowledgedLb.toLocaleString()} lb acknowledged in the
                      fixture · 0 operational changes
                    </span>
                  </div>
                </div>
              </Panel>

              <div className={styles.responseList}>
                {visibleCompletedPreview.responses.map((response) => {
                  const recipient = visibleCompletedPreview.recipients.find(
                    (candidate) => candidate.partnerId === response.partnerId,
                  );
                  return recipient ? (
                    <ResponseCard
                      key={response.partnerId}
                      response={response}
                      recipient={recipient}
                    />
                  ) : null;
                })}
              </div>

              <Panel title="Preview audit">
                <ol className={styles.auditList}>
                  {visibleCompletedPreview.events.map((event) => (
                    <li key={`${event.stage}-${event.occurredAt}`}>
                      <span className={styles.auditDot} aria-hidden="true" />
                      <div>
                        <strong>{event.stage.replaceAll("_", " ")}</strong>
                        <span>{event.note}</span>
                        <small>{event.actorId} · {formatDateTime(event.occurredAt)}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            </>
          ) : (
            <Panel title="Waiting for authorization">
              <div className={styles.waiting}>
                <UsersRound size={23} aria-hidden="true" />
                <strong>Recipient scripts are ready for review.</strong>
                <span>
                  Results remain empty until a staff member authorizes and runs the
                  local simulation.
                </span>
              </div>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
