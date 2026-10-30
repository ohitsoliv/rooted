// src/components/ClinicianReport.jsx — Rooted Health Tracker
// Printable doctor report. Page 1 stands alone; page 2 is detail; then an
// appendix. Describes patterns only — never names or suggests a diagnosis.

import ReportChart from "./ReportChart";
import { fmt, shortDate } from "../analysis/report";
import { sentence, checkedLabel, MIN_N } from "../analysis/patterns";
import { MIN_BASELINE_DAYS } from "../analysis/baseline";
import { PHQ9, GAD7 } from "../screeners";
import { MOOD_OPTIONS, ACTIVATION_OPTIONS, BODY_OPTIONS, PAIN_STOP_OPTIONS } from "../questions";

const longDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const of = (a, b) => (b ? `${a} of ${b} days` : "not answered");
const statLine = (s, unit = "") => (s.n ? `${fmt(s.avg)}${unit} average, range ${fmt(s.min, s.min % 1 ? 1 : 0)}–${fmt(s.max, s.max % 1 ? 1 : 0)}${unit} (n=${s.n})` : "no data");
const list = (t, max = 6) => (t.length ? t.slice(0, max).map((x) => `${x.label} (${x.n})`).join(", ") : "none");
const clock = (m) => (m == null ? "—" : new Date(2000, 0, 1, Math.floor(m / 60), Math.round(m % 60)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));

function Section({ title, children, split = false }) {
  return (
    <section className={split ? "rr-section rr-split" : "rr-section"}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Rows({ rows }) {
  return (
    <table className="rr-kv">
      <tbody>
        {rows.filter(Boolean).map(([k, v]) => (
          <tr key={k}><th>{k}</th><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ClinicianReport({ report }) {
  const r = report;
  const { mood, sleep, body, attention, sensory, meds, cycle } = r;

  return (
    <div className="rr">
      {/* ================= PAGE 1 ================= */}
      <div className="rr-page">
        <header className="rr-head">
          <div>
            <h1>Daily tracking summary</h1>
            <p className="rr-muted">{longDate(r.start)} – {longDate(r.end)} · self-reported in the Rooted app · generated {longDate(new Date().toISOString().slice(0, 10))}</p>
          </div>
        </header>

        <table className="rr-kv rr-top">
          <tbody>
            <tr><th>Coverage</th><td>{r.logged} of {r.totalDays} days logged ({pct(r.logged, r.totalDays)}) · {r.checkins} check-ins · {r.backfilled} day{r.backfilled === 1 ? "" : "s"} filled in later from memory{r.goodDays || r.bareDays.length ? ` · shorter log: ${r.goodDays} quick, ${r.bareDays.length} bare-minimum` : ""}</td></tr>
            <tr><th>Current meds</th><td>{meds.current.length ? meds.current.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""}`).join("; ") : "not entered"}{meds.changes.length ? ` · Changes in period: ${meds.changes.map((c) => `${shortDate(c.date)} ${c.text}`).join("; ")}` : ""}</td></tr>
            {r.reference && !r.reference.insufficient && <tr><th>Okay-period usual</th><td>{shortDate(r.reference.start)}–{shortDate(r.reference.end)} (chosen by the patient): {[r.reference.mood != null && `mood ${fmt(r.reference.mood)}`, r.reference.activation != null && `mind ${fmt(r.reference.activation)}`, r.reference.body != null && `body ${fmt(r.reference.body)}`].filter(Boolean).join(" · ")}</td></tr>}
            <tr><th>Typical in this period</th><td>{r.usual.ready ? [r.usual.mood && `mood ${r.usual.mood}`, r.usual.mind && `mind ${r.usual.mind}`, r.usual.body && `body ${r.usual.body}`, r.usual.pain && `pain in the way: ${r.usual.pain.toLowerCase()}`, r.usual.sleep && `sleep ${r.usual.sleep}`].filter(Boolean).join(" · ") : `needs ${MIN_BASELINE_DAYS}+ logged days`}</td></tr>
          </tbody>
        </table>

        {r.limited && (
          <p className="rr-warn">Limited data — {r.logged} days logged ({pct(r.logged, r.totalDays)} of the period). Patterns are not reliable until about 21+ days and 60%+ coverage.</p>
        )}

        <Section title="Flags">
          <table className="rr-flags">
            <tbody>
              {r.flags.map((f) => (
                <tr key={f.label} className={f.critical && f.count ? "rr-critical" : ""}>
                  <th>{f.label}</th>
                  <td className="rr-num">{f.count === 0 ? "none" : f.count}</td>
                  <td className="rr-muted">{f.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="rr-muted rr-small">{r.baselineBasis}</p>
        </Section>

        <Section title="Mood, mind, body, and sleep">
          <ReportChart report={r} />
        </Section>

        <Section title="Patterns noticed" split>
          {r.patterns.top.length ? (
            <ul className="rr-list">
              {r.patterns.top.map((x) => <li key={x.id}>{sentence(x)}</li>)}
            </ul>
          ) : (
            <p>{r.patterns.testedCount ? "No differences large enough to report." : `Not enough data yet — each comparison needs at least ${MIN_N} days in both groups.`}</p>
          )}
          {r.patterns.noPattern.length > 0 && (
            <p className="rr-muted rr-small">Checked, no clear difference: {r.patterns.noPattern.slice(0, 2).map(checkedLabel).join("; ")}{r.patterns.noPattern.length > 2 ? `; and ${r.patterns.noPattern.length - 2} more` : ""}.</p>
          )}
          <p className="rr-muted rr-small">These are associations in one person's self-reported data, not causes. Reported only when both groups have {MIN_N}+ days and the gap is at least 0.75 points (0–4 scales), 25 percentage points (yes/no), 1 hour (sleep), or 10 bpm.</p>
        </Section>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div className="rr-page">
        <h2>Detail</h2>

        <Section title="Mood stability">
          <Rows rows={[
            ["Mood", statLine(mood.stat)],
            ["Mind speed", statLine(mood.activation)],
            ["Body energy", statLine(mood.body)],
            ["Mood below usual while mind above usual (same check-in)", mood.mismatchN ? `${mood.mismatchDays} of ${mood.mismatchN} days` : "no data"],
            mood.baselineDays ? ["Compared with their usual", `mood 1+ below usual on ${mood.moodBelowUsual} days; mind 1+ above usual on ${mood.mindAboveUsual} days (of ${mood.baselineDays} days with a baseline)`] : null,
            ["Day-to-day change", mood.masd ? `${fmt(mood.masd.value, 2)} points on average between consecutive days (n=${mood.masd.n} pairs)` : "not enough consecutive days"],
            ["Within-day swings of 2+ points", mood.multiCheckinDays ? `${mood.swingDays} of ${mood.multiCheckinDays} days with 2+ check-ins` : "no days with 2+ check-ins"],
            ["Longest stretch with mood below their usual", mood.longestLow ? `${mood.longestLow.length} day${mood.longestLow.length === 1 ? "" : "s"} (${shortDate(mood.longestLow.start)}–${shortDate(mood.longestLow.end)})` : "none"],
            ["Longest stretch with mind above their usual", mood.longestHigh ? `${mood.longestHigh.length} day${mood.longestHigh.length === 1 ? "" : "s"} (${shortDate(mood.longestHigh.start)}–${shortDate(mood.longestHigh.end)})` : "none"],
            ["How steady (self-rated)", list(mood.steady)],
            ["How long the biggest shift lasted", list(mood.shiftLength)],
            ["What set shifts off", list(mood.triggers, 8)],
            ["\"Had more…\" chatting", `${mood.talkingFast} days`],
            ["\"Had more…\" ideas or plans", `${mood.newProjects} days`],
            ["\"Had more…\" energy", `${mood.noRest} days`],
            ["\"Had more…\" things wanted to buy", `${mood.moreBuying} days`],
            ["Days with 2+ of the four above", `${mood.hypomanicSignDays}`],
            ["…of those, with short sleep without tiredness or mind above usual", mood.activationCombo.length ? `${mood.activationCombo.length} (${mood.activationCombo.map(shortDate).join(", ")})` : "none"],
            ["\"Surprised myself by…\" (unplanned actions)", list(mood.impulsive)],
            mood.feelingAnswered ? ["Feelings named (optional; main category, times picked)", `${list(mood.feelings, 7)}${mood.cantTell ? ` · "can't tell" ${mood.cantTell}×` : ""}`] : null,
            mood.sensations.length ? ["Body sensations described", list(mood.sensations, 6)] : null,
            ["Usual interests felt boring or pointless", `${mood.anhedoniaDays} days (a bit or yes)`],
            ["Thought someone was mad or pulling away", `${mood.othersMadDays} days (a little or a lot)`],
          ]} />
        </Section>

        <Section title="Sleep">
          <Rows rows={[
            ["Hours", statLine(sleep.hours, " h")],
            ["Quality", statLine(sleep.quality)],
            ["Nights under 6 h", `${sleep.short}`],
            ["…of those, not feeling tired", `${sleep.shortNotTired}`],
            ["Nights 2+ h below their usual", `${sleep.belowUsual}`],
            ["Nightmares", of(sleep.nightmares, sleep.nightmaresN)],
          ]} />
        </Section>

        <Section title="Body">
          <Rows rows={[
            ["Pain getting in the way", body.painStop.n ? `slowed or stopped activity on ${body.painSlowedOrStopped} of ${body.painStop.n} days; stopped activity on ${body.painStopped}` : "no data"],
            body.painBaselineDays ? ["Pain worse than their usual", `${body.painWorseThanUsual} of ${body.painBaselineDays} days`] : null,
            body.painLegacy.n ? ["Pain level (older 0–4 scale)", statLine(body.painLegacy)] : null,
            ["Hard-to-ignore symptoms", body.symptomHardDays.map((s) => `${s.label} ${s.hard}/${s.n}`).join(" · ")],
            ["POTS symptoms", body.potsN ? `${body.potsDays} of ${body.potsN} days (dizzy ${body.dizzy}, palpitations ${body.palpitations}, fainting ${body.fainting}); worse standing ${body.worseStanding}` : "not logged"],
            ["Heart rate logged", body.hr.n ? `${body.hr.min}–${body.hr.max} bpm across ${body.hr.n} days` : "none"],
            ["EDS", `flare days ${body.flare}, joint pain days ${body.jointPain}, subluxation days ${body.subluxation}`],
            ["Most affected joints", list(body.joints)],
          ]} />
        </Section>

        <Section title="Attention and daily functioning">
          <Rows rows={[
            ["Trouble starting tasks", attention.hardStartN ? `${attention.hardStart} of ${attention.hardStartN} days (couldn't start at all: ${attention.couldntStart})` : "not answered"],
            ["Lost or forgot something important", of(attention.forgot, attention.forgotN)],
            ["Late / lost track of time", of(attention.timeSlip, attention.timeSlipN)],
            ["Stuck on one thing for hours", of(attention.hyperfocus, attention.hyperfocusN)],
            ["Basic tasks hard (shower, eating, replying)", attention.basicsN ? `${attention.basicsHard} of ${attention.basicsN} days` : "not answered"],
            ["Hard to think clearly (hard to ignore or worse)", `${attention.thinkHard} days`],
            ["Class attendance on school days", list(attention.school)],
          ]} />
        </Section>

        <Section title="Sensory and social">
          <Rows rows={[
            ["Loud/bright/crowded: a lot or too much", sensory.sensoryN ? `${sensory.overload} of ${sensory.sensoryN} days` : "not answered"],
            ["A lot of people time", sensory.peopleN ? `${sensory.peopleLot} of ${sensory.peopleN} days` : "not answered"],
            ["Masked a lot", sensory.maskingN ? `${sensory.maskingLot} of ${sensory.maskingN} days` : "not answered"],
            ["No time on things they love", sensory.lovedN ? `${sensory.lovedNone} of ${sensory.lovedN} days` : "not answered"],
            ["Meltdown/shutdown days", `${sensory.meltDays}`],
            ["Tagged on those days", list(sensory.meltPreceding, 8)],
          ]} />
        </Section>

        {r.helped.any ? (
          <Section title="What helped (self-reported)">
            <Rows rows={[
              r.helped.afterLimit.length || r.helped.limitNothing ? ["Coming down after a meltdown/shutdown", `${list(r.helped.afterLimit, 6)}${r.helped.limitNothing ? ` · nothing yet: ${r.helped.limitNothing}×` : ""}`] : null,
              r.helped.body.length || r.helped.bodyNothing ? ["Body, on rough symptom days", `${list(r.helped.body, 6)}${r.helped.bodyNothing ? ` · nothing worked: ${r.helped.bodyNothing}×` : ""}`] : null,
              r.helped.doing.length ? ["Tried when mood was low or pain in the way", list(r.helped.doing, 6)] : null,
              r.helped.followUps.length ? ["…helped by next check-in? (yes / a bit / no / worse)", r.helped.followUps.slice(0, 6).map((f) => `${f.label} ${f.yes}/${f.bit}/${f.no}/${f.worse}`).join(" · ")] : null,
              r.helped.sleep.length ? ["Before good nights", list(r.helped.sleep, 6)] : null,
              r.helped.today.length ? ["Helped today (general)", list(r.helped.today, 6)] : null,
            ]} />
          </Section>
        ) : null}

        <Section title="Medications and substances">
          <Rows rows={[
            ...meds.perMed.filter((m) => m.n).map((m) => [`${m.name}${m.dose ? ` ${m.dose}` : ""}${m.stopped ? " (stopped)" : ""}`, `on time ${m.onTime}, late ${m.late}, missed ${m.missed} (n=${m.n})`]),
            ["Days with any missed med", of(meds.missedDays, meds.medsN)],
            meds.stimTime.n ? ["Stimulant taken at", `${clock(meds.stimTime.avg)} on average, ${clock(meds.stimTime.min)}–${clock(meds.stimTime.max)} (n=${meds.stimTime.n})`] : null,
            meds.wearOff.length ? ["Stimulant wore off", list(meds.wearOff)] : null,
            ["Side effects", list(meds.sideEffects)],
            ["Caffeine drinks", meds.caffeine.n ? `${fmt(meds.caffeine.avg)} per day (n=${meds.caffeine.n}; 3 = 3 or more)` : "not answered"],
            ["Alcohol", of(meds.alcoholDays, meds.alcoholN)],
            meds.substances ? ["Other substances", list(meds.substances)] : null,
          ]} />
        </Section>

        {cycle.tracked && (
          <Section title="Menstrual cycle">
            {cycle.ready ? (
              <table className="rr-grid">
                <thead><tr><th></th><th>Days</th><th>Mood avg</th><th>Pain avg</th><th>POTS days</th><th>Meltdown/shutdown</th></tr></thead>
                <tbody>
                  {[["7 days before period", cycle.premenstrual], ["Period days", cycle.period], ["Other days", cycle.other]].map(([k, v]) => (
                    <tr key={k}><th>{k}</th><td>{v.n}</td><td>{fmt(v.mood)}</td><td>{fmt(v.pain)}</td><td>{v.pots == null ? "—" : `${Math.round(v.pots * 100)}%`}</td><td>{v.melt}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="rr-muted">{cycle.cycles} cycle start{cycle.cycles === 1 ? "" : "s"} logged; comparison shown after 2.</p>}
          </Section>
        )}

        {r.lookbacks.length > 0 && (
          <Section title="Weekly look-backs (hindsight)">
            <table className="rr-grid">
              <thead><tr><th>Week</th><th>Overall</th><th>Looks different now?</th></tr></thead>
              <tbody>
                {r.lookbacks.map((l) => <tr key={l.date}><td>{l.week}</td><td>{l.overall || "—"}</td><td>{l.hindsight || "—"}</td></tr>)}
              </tbody>
            </table>
          </Section>
        )}

        <Section title="Standard questionnaires">
          {r.screeners.length ? (
            <table className="rr-grid">
              <thead><tr><th>Date</th><th>PHQ-9 (0–{PHQ9.max})</th><th>GAD-7 (0–{GAD7.max})</th></tr></thead>
              <tbody>
                {r.screeners.map((s) => (
                  <tr key={s.date}><td>{shortDate(s.date)}</td><td>{s.phq9 ?? "—"} {s.phq9Band && `(${s.phq9Band})`}</td><td>{s.gad7 ?? "—"} {s.gad7Band && `(${s.gad7Band})`}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="rr-muted">None completed in this period.</p>}
          <p className="rr-muted rr-small">Standard severity bands. PHQ-9: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe. GAD-7: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe.</p>
        </Section>

        {r.notes.length > 0 && (
          <Section title="In their own words (chosen by the patient)">
            <ul className="rr-list">
              {r.notes.map((n) => <li key={`${n.date}${n.text}`}><strong>{shortDate(n.date)}:</strong> “{n.text}”</li>)}
            </ul>
          </Section>
        )}
      </div>

      {/* ================= APPENDIX ================= */}
      <div className="rr-page">
        <h2>Appendix</h2>
        <Section title="What the scales mean">
          <Rows rows={[
            ["Mood (check-in, averaged per day)", MOOD_OPTIONS.map((o) => `${o.score} ${o.label}`).join(" · ")],
            ["Mind speed (two-direction)", ACTIVATION_OPTIONS.map((o) => `${o.score} ${o.label}`).join(" · ")],
            ["Body energy (two-direction)", `${BODY_OPTIONS.map((o) => `${o.score} ${o.label}`).join(" · ")}. Asked separately from mind because EDS/POTS can make the body heavy regardless of mood.`],
            ["Pain getting in the way (daily max)", PAIN_STOP_OPTIONS.map((o) => `${o.score} ${o.label}`).join(" · ")],
            ["Sleep hours (answer ranges, plotted at midpoint)", "Under 4 → 3.5 · 4–6 → 5 · 6–8 → 7 · 8–10 → 9 · Over 10 → 10.5"],
            ["Body symptom severity", "Didn't notice · Noticed, could ignore · Hard to ignore · Couldn't do things"],
            ["Every question", "Has a \"Don't know\" option, counted separately from skipped. Questions use concrete, everyday wording on purpose: the patient may find naming feelings or body signals difficult, and asked for questions that don't reveal what they screen for, to avoid second-guessing answers. Clinical meaning is mapped in this report."],
          ]} />
        </Section>

        <Section title="Day by day">
          <table className="rr-grid rr-daily">
            <thead>
              <tr><th>Date</th><th>Mood avg (low–high)</th><th>Mind</th><th>Body</th><th>Sleep h</th><th>Pain</th><th>Melt/shut</th><th>POTS</th><th>Missed med</th><th>Other</th></tr>
            </thead>
            <tbody>
              {r.days.filter((d) => d.logged || d.mood != null).map((d) => (
                <tr key={d.date}>
                  <td>{shortDate(d.date)}</td>
                  <td>{fmt(d.mood)}{d.moodSwing != null ? ` (${fmt(d.moodMin, 0)}–${fmt(d.moodMax, 0)})` : ""}</td>
                  <td>{fmt(d.activation)}</td>
                  <td>{fmt(d.body)}</td>
                  <td>{d.sleepHours ?? "—"}</td>
                  <td>{d.painStop != null ? fmt(d.painStop, 0) : d.painLegacy != null ? `${d.painLegacy}*` : "—"}</td>
                  <td>{d.meltdown && d.shutdown ? "both" : d.meltdown ? "melt" : d.shutdown ? "shut" : d.meltdownOrShutdown === false ? "no" : "—"}</td>
                  <td>{d.potsAny == null ? "—" : d.potsAny ? "yes" : "no"}</td>
                  <td>{d.medsMissed == null ? "—" : d.medsMissed ? "yes" : "no"}</td>
                  <td>{[d.period && "period", d.flare && "flare", d.shortNotTired && "short sleep, not tired", d.safety && d.safety !== "no" && "safety", d.sick && "sick/injured", d.mode === "bare" && "bare min.", d.mode === "good" && "quick log", d.backfilled && "from memory"].filter(Boolean).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {r.days.some((d) => d.painStop == null && d.painLegacy != null) && <p className="rr-muted rr-small">* Pain level on the app's older 0–4 severity scale.</p>}
        </Section>

        <Section title="Data quality">
          {r.bareDays.length > 0 && <p>Bare-minimum days (patient chose the 4-question log, often on harder days): {r.bareDays.map(shortDate).join(", ")}.</p>}
          {r.hiddenList.length > 0 && <p>Turned off by the patient (not asked at the time of this report): {r.hiddenList.join("; ")}.</p>}
          <p>Coverage {pct(r.logged, r.totalDays)} ({r.logged}/{r.totalDays} days). {r.backfilled} day{r.backfilled === 1 ? "" : "s"} filled in later from memory. Missing days are not random — people often skip their hardest days.</p>
          {r.dkRows.length > 0 && (
            <table className="rr-grid">
              <thead><tr><th>Question</th><th>Times shown</th><th>Don't know</th><th>Skipped</th></tr></thead>
              <tbody>
                {r.dkRows.slice(0, 10).map((q) => (
                  <tr key={q.key}><td>{q.prompt}</td><td>{q.total}</td><td>{pct(q.dk, q.total)}</td><td>{pct(q.skipped, q.total)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <style>{REPORT_CSS}</style>
    </div>
  );
}

const REPORT_CSS = `
.rr { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; background: #fff; font-size: 10pt; line-height: 1.35; }
.rr-page { max-width: 7.5in; margin: 0 auto; padding: 0.35in 0.3in; }
.rr h1 { font-size: 16pt; margin: 0 0 2px; }
.rr h2 { font-size: 13pt; margin: 0 0 8px; border-bottom: 1.5px solid #000; padding-bottom: 3px; }
.rr h3 { font-size: 10.5pt; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
.rr-section { margin: 8px 0 10px; break-inside: avoid; }
.rr-split { break-inside: auto; }
.rr-muted { color: #444; }
.rr-small { font-size: 8.5pt; margin: 4px 0 0; }
.rr-head { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
.rr table { border-collapse: collapse; width: 100%; }
.rr-kv th { text-align: left; font-weight: 600; width: 38%; padding: 2px 8px 2px 0; vertical-align: top; }
.rr-kv td { padding: 2px 0; vertical-align: top; }
.rr-top th { width: 18%; }
.rr-kv tr + tr th, .rr-kv tr + tr td { border-top: 1px solid #e5e5e5; }
.rr-flags th { text-align: left; font-weight: 600; padding: 2px 8px 2px 0; width: 44%; border-top: 1px solid #ddd; }
.rr-flags td { padding: 2px 6px; border-top: 1px solid #ddd; vertical-align: top; }
.rr-num { width: 8%; font-weight: 700; }
.rr-critical th, .rr-critical td { font-weight: 800; border: 2px solid #000 !important; }
.rr-warn { border: 2px solid #000; padding: 6px 10px; font-weight: 700; margin: 6px 0; }
.rr-list { margin: 0; padding-left: 18px; }
.rr-list li { margin: 2px 0; }
.rr-grid th, .rr-grid td { border: 1px solid #ccc; padding: 2px 5px; text-align: left; vertical-align: top; }
.rr-grid thead th { background: #f0f0f0; }
.rr-daily { font-size: 8.5pt; }
.rr-overlay { position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: #fff; }
@media print {
  @page { size: letter; margin: 0.4in; }
  body { background: #fff !important; padding: 0 !important; display: block !important; }
  #root { max-width: none !important; box-shadow: none !important; }
  .rr-overlay { position: static; overflow: visible; }
  .no-print, .bottom-nav { display: none !important; }
  .rr-page { padding: 0; max-width: none; break-after: page; }
  .rr-page:last-child { break-after: auto; }
  .rr-daily tr { break-inside: avoid; }
}
`;
