import { useEffect, useMemo, useState } from "react";
import {
  MissingRateDataError,
  type PricingModel,
  type UsageType,
} from "../domain";
import { defaultProviderId, providerRegistry } from "../app/registry";
import {
  ArchiveIcon,
  BoltIcon,
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  FlowIcon,
  InfoIcon,
  TrendIcon,
} from "./icons";

const nf = new Intl.NumberFormat("en-US");
const storagePrefix = "credit-consumption-calc-v2";
type SavedMonth = {
  inputs: Record<string, number>;
  days: number;
  credits: number;
  savedAt: string;
};
type Account = {
  period: string;
  total: number;
  consumed: number;
  endDate: string;
  inputs: Record<string, number>;
  months: Record<string, SavedMonth>;
};

function freshAccount(): Account {
  const date = new Date();
  return {
    period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    total: 0,
    consumed: 0,
    endDate: "",
    inputs: {},
    months: {},
  };
}
function daysFor(period: string): number {
  if (!period) return 30;
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}
function monthName(period: string): string {
  if (!period) return "-";
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}
function formatNumber(value: number): string {
  return nf.format(Math.round(value));
}
function formatIsoDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function KpiInfo({ text }: { text: string }) {
  return (
    <span className="kpi-info" title={text} role="img" aria-label={text}>
      <InfoIcon width={12} height={12} />
    </span>
  );
}
function readAccount(key: string): Account {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...freshAccount(), ...JSON.parse(saved) } : freshAccount();
  } catch {
    return freshAccount();
  }
}
function contractRemaining(endDate: string): string {
  if (!endDate) return "-";
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const difference = end.getTime() - today.getTime();
  if (difference < 0) return "Expired";
  return `${Math.round(difference / 86400000)} days`;
}

export function App() {
  const [providerId, setProviderId] = useState(defaultProviderId);
  const provider =
    providerRegistry.get(providerId) ?? [...providerRegistry.values()][0];
  const [modelId, setModelId] = useState(
    provider.models?.[0]?.id ?? provider.id,
  );
  const profile: PricingModel =
    provider.models?.find((model) => model.id === modelId) ?? provider;
  const storageKey = `${storagePrefix}-${profile.id}`;
  const [account, setAccount] = useState<Account>(() =>
    readAccount(storageKey),
  );
  const days = daysFor(account.period);
  const usageTypes = profile.usageTypes();

  useEffect(() => {
    setModelId(provider.models?.[0]?.id ?? provider.id);
  }, [provider]);
  useEffect(() => {
    setAccount(readAccount(storageKey));
  }, [storageKey]);
  function updateAccount(next: Account) {
    setAccount(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Storage is optional. */
    }
  }
  function updateInput(id: string, value: string) {
    updateAccount({
      ...account,
      inputs: { ...account.inputs, [id]: Math.max(0, Number(value) || 0) },
    });
  }
  function price() {
    const input = Object.fromEntries(
      usageTypes.map((item) => [
        item.id,
        (account.inputs[item.id] ?? 0) * (item.inputBasis === "day" ? days : 1),
      ]),
    );
    try {
      return { result: profile.price(input), error: null };
    } catch (cause) {
      return {
        result: null,
        error:
          cause instanceof MissingRateDataError
            ? cause.message
            : "Couldn't price this input. Check the rate card configuration.",
      };
    }
  }
  const priced = useMemo(price, [account.inputs, days, profile, usageTypes]);
  const total = priced.result?.total ?? 0;
  const remaining = account.total - account.consumed - total;
  const utilization = account.total
    ? (account.consumed + total) / account.total
    : 0;
  const creditsByBasis = usageTypes.reduce(
    (sums, item) => {
      const amount =
        priced.result?.lines.find((line) => line.usageTypeId === item.id)
          ?.amount ?? 0;
      if (item.inputBasis === "day") sums.day += amount;
      else sums.month += amount;
      return sums;
    },
    { day: 0, month: 0 },
  );
  function saveMonth() {
    if (!priced.result || !account.period) return;
    updateAccount({
      ...account,
      months: {
        ...account.months,
        [account.period]: {
          inputs: account.inputs,
          days,
          credits: priced.result.total,
          savedAt: new Date().toISOString(),
        },
      },
    });
  }
  function removeMonth(period: string) {
    const months = { ...account.months };
    delete months[period];
    updateAccount({ ...account, months });
  }
  const savedPeriods = Object.keys(account.months).sort();
  const savedTotal = Object.values(account.months).reduce(
    (sum, month) => sum + month.credits,
    0,
  );
  function downloadCsv() {
    const rows: (string | number)[][] = [
      ["Credit Consumption Calculator"],
      ["Subscription", profile.displayName],
      ["Month", monthName(account.period)],
      ["Total Credits", account.total],
      ["Consumed To Date", account.consumed],
      ["Calculated", total],
      ["Remaining", remaining],
      ["Order End Date", account.endDate],
      [],
      ["Usage Type", "Input", "Monthly Units", "Credits"],
    ];
    usageTypes.forEach((item) => {
      const input = account.inputs[item.id] ?? 0;
      rows.push([
        item.label,
        input,
        input * (item.inputBasis === "day" ? days : 1),
        priced.result?.lines.find((line) => line.usageTypeId === item.id)
          ?.amount ?? 0,
      ]);
    });
    rows.push([], ["Saved Ledger"], ["Month", "Days", "Credits", "Cumulative"]);
    let cumulative = 0;
    savedPeriods.forEach((period) => {
      const month = account.months[period];
      cumulative += month.credits;
      rows.push([monthName(period), month.days, month.credits, cumulative]);
    });
    rows.push(["Saved Total", "", savedTotal, ""]);
    const escape = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit-consumption-${account.period.replace("-", "")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-name">Credit Consumption Calculator</span>
        </div>
        <nav className="subscription-nav" aria-label="Subscriptions">
          <h2>Subscriptions</h2>
          {[...providerRegistry.values()].map((item) => {
            const ItemIcon = item.id.includes("automation")
              ? BoltIcon
              : FlowIcon;
            return (
              <button
                className={`nav-item${item.id === provider.id ? " active" : ""}`}
                type="button"
                key={item.id}
                onClick={() => setProviderId(item.id)}
              >
                <ItemIcon width={18} height={18} />
                <span>{item.displayName}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-links">
          <a
            href="https://anypoint.mulesoft.com/usage-reports/"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon width={14} height={14} />
            <span>Anypoint Usage Reports</span>
          </a>
          <a
            href="https://help.salesforce.com/s/articleView?id=xcloud.wallet_access.htm&type=5"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon width={14} height={14} />
            <span>Salesforce Digital Wallet</span>
          </a>
        </div>
      </aside>
      <main className="workspace">
        <header className="page-header">
          <h1>{provider.displayName}</h1>
        </header>
        <div className="canvas">
          <section className="band" aria-labelledby="overview-title">
            <h2 className="band-title" id="overview-title">
              Utilization Overview
            </h2>
            <div className="kpi-grid">
              <article className="card kpi-card">
                <h3 className="kpi-title">
                  Credits Remaining
                  <KpiInfo text="Total credits, less what you've already consumed and this month's calculated usage." />
                </h3>
                <p
                  className={`kpi-value${remaining < 0 ? " negative" : utilization >= 0.85 ? " warning" : ""}`}
                >
                  {formatNumber(remaining)}
                </p>
                <p className="kpi-subtitle">
                  {account.total
                    ? `Of ${formatNumber(account.total)} total credits`
                    : "Add your total credits below"}
                </p>
                <div className="gauge">
                  <span
                    style={{
                      width: `${account.total ? Math.min(account.consumed / account.total, 1) * 100 : 0}%`,
                    }}
                  />
                  <span
                    className="pending"
                    style={{
                      width: `${account.total ? Math.min(total / account.total, 1) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="kpi-footer">
                  <div className="kpi-chips">
                    <span className="kpi-chip">
                      <span className="chip-dot consumed" />
                      {formatNumber(account.consumed)} consumed
                    </span>
                    <span className="kpi-chip">
                      <span className="chip-dot pending" />
                      {formatNumber(total)} this month
                    </span>
                  </div>
                </div>
              </article>
              <article className="card kpi-card">
                <h3 className="kpi-title">
                  Calculated This Month
                  <KpiInfo text="What the usage you've entered for the selected month comes to, in credits." />
                </h3>
                <p className="kpi-value">{formatNumber(total)}</p>
                <p className="kpi-subtitle">
                  {monthName(account.period)} · {days} days
                </p>
                <div className="kpi-footer">
                  <div className="kpi-chips">
                    {usageTypes.some((item) => item.inputBasis === "day") && (
                      <span className="kpi-chip">
                        <ClockIcon className="chip-icon day" />
                        {formatNumber(creditsByBasis.day)} Per Day
                      </span>
                    )}
                    {usageTypes.some((item) => item.inputBasis !== "day") && (
                      <span className="kpi-chip">
                        <CalendarIcon className="chip-icon month" />
                        {formatNumber(creditsByBasis.month)} Per Month
                      </span>
                    )}
                  </div>
                </div>
              </article>
              <article className="card kpi-card">
                <h3 className="kpi-title">
                  Consumed To Date
                  <KpiInfo text="What you'd already used before the selected month." />
                </h3>
                <p className="kpi-value">{formatNumber(account.consumed)}</p>
                <p className="kpi-subtitle">
                  {account.total
                    ? `${((account.consumed / account.total) * 100).toFixed(1)}% of total credits`
                    : "Enter total credits to see the percentage"}
                </p>
                <div className="kpi-footer">
                  <div className="kpi-chips">
                    <span className="kpi-chip">
                      <TrendIcon className="chip-icon trend" />
                      {(utilization * 100).toFixed(1)}% including this month
                    </span>
                  </div>
                </div>
              </article>
              <article className="card kpi-card">
                <h3 className="kpi-title">
                  Contract Remaining
                  <KpiInfo text="Days left before your Order End Date." />
                </h3>
                <p className="kpi-value">
                  {contractRemaining(account.endDate)}
                </p>
                <p className="kpi-subtitle">
                  {account.endDate
                    ? `Order ends ${formatIsoDate(account.endDate)}`
                    : "Set an Order End Date below"}
                </p>
                <div className="kpi-footer">
                  <div className="kpi-chips">
                    <span className="kpi-chip">
                      <ArchiveIcon className="chip-icon saved" />
                      {savedPeriods.length}{" "}
                      {savedPeriods.length === 1 ? "month" : "months"} saved
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </section>
          <section className="band" aria-labelledby="contract-title">
            <div className="band-heading">
              <h2 className="band-title" id="contract-title">
                Contract Details
              </h2>
              {provider.models && (
                <div className="model-picker">
                  <span className="model-label" id="credit-system-label">
                    Credit System
                  </span>
                  <div
                    className="model-switcher"
                    role="group"
                    aria-labelledby="credit-system-label"
                  >
                    {provider.models.map((model) => (
                      <button
                        className={model.id === modelId ? "selected" : ""}
                        key={model.id}
                        type="button"
                        aria-pressed={model.id === modelId}
                        onClick={() => setModelId(model.id)}
                      >
                        {model.rateCard.version}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="controls-grid">
              <section className="card control-card">
                <label className="control">
                  <span>Calculation Month</span>
                  <input
                    type="month"
                    value={account.period}
                    onChange={(event) =>
                      updateAccount({
                        ...account,
                        period: event.target.value,
                        inputs:
                          account.months[event.target.value]?.inputs ?? {},
                      })
                    }
                  />
                </label>
              </section>
              <section className="card control-card">
                <label className="control">
                  <span>Total Credits</span>
                  <input
                    type="number"
                    min="0"
                    value={account.total || ""}
                    placeholder="0"
                    onChange={(event) =>
                      updateAccount({
                        ...account,
                        total: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                </label>
              </section>
              <section className="card control-card">
                <label className="control">
                  <span>Consumed Credits</span>
                  <input
                    type="number"
                    min="0"
                    value={account.consumed || ""}
                    placeholder="0"
                    onChange={(event) =>
                      updateAccount({
                        ...account,
                        consumed: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                </label>
              </section>
              <section className="card control-card">
                <label className="control">
                  <span>Order End Date</span>
                  <input
                    type="date"
                    value={account.endDate}
                    onChange={(event) =>
                      updateAccount({ ...account, endDate: event.target.value })
                    }
                  />
                </label>
              </section>
            </div>
          </section>
          <section className="card usage-card">
            <div className="card-heading">
              <h2>
                Usage This Month{" "}
                <em>
                  · {monthName(account.period)} · {days} days
                </em>
              </h2>
              <div className="button-row">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    updateAccount({
                      ...account,
                      inputs: Object.fromEntries(
                        usageTypes.map((item) => [
                          item.id,
                          item.exampleQuantity ?? 0,
                        ]),
                      ),
                    })
                  }
                >
                  Load Example Usage
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => updateAccount({ ...account, inputs: {} })}
                >
                  Clear Month
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={saveMonth}
                >
                  Save Month
                </button>
              </div>
            </div>
            <p className="basis-note">
              Enter a daily figure for <b>Per Day</b> meters and it's multiplied
              by the days in the selected month. <b>Per Month</b> meters are
              used as entered.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="left">Usage Type</th>
                    <th>Input</th>
                    <th>Monthly Units</th>
                    <th>Top Tier</th>
                    <th>Monthly Credits</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {usageTypes.map((item: UsageType) => {
                    const input = account.inputs[item.id] ?? 0;
                    const monthly =
                      input * (item.inputBasis === "day" ? days : 1);
                    const line = priced.result?.lines.find(
                      (value) => value.usageTypeId === item.id,
                    );
                    const share = total ? (line?.amount ?? 0) / total : 0;
                    const tier = line?.tierBreakdown?.at(-1)?.tier;
                    return (
                      <tr key={item.id}>
                        <td className="left">
                          <strong>{item.label}</strong>
                          <small>
                            {item.basis} ·{" "}
                            {item.inputBasis === "day"
                              ? "per day"
                              : "per month"}
                          </small>
                        </td>
                        <td>
                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            value={input || ""}
                            placeholder="0"
                            onChange={(event) =>
                              updateInput(item.id, event.target.value)
                            }
                            aria-label={`${item.label} input`}
                          />
                        </td>
                        <td>{formatNumber(monthly)}</td>
                        <td>{tier ? `T${tier}` : "-"}</td>
                        <td>{formatNumber(line?.amount ?? 0)}</td>
                        <td>{(share * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="left">Calculated · This Month</td>
                    <td />
                    <td />
                    <td />
                    <td>{formatNumber(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          {priced.error && (
            <section className="notice" role="alert">
              <strong>Price Unavailable</strong>
              <span>{priced.error}</span>
            </section>
          )}
          <section className="card ledger-card">
            <div className="card-heading">
              <h2>Saved Ledger</h2>
              <button
                className="button secondary"
                type="button"
                onClick={downloadCsv}
              >
                Download CSV
              </button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="left">Month</th>
                    <th>Days</th>
                    <th>Credits</th>
                    <th>Cumulative</th>
                    <th>Saved</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {savedPeriods.length === 0 ? (
                    <tr>
                      <td className="empty left" colSpan={6}>
                        Nothing saved yet. Fill in a month's usage and hit Save
                        Month.
                      </td>
                    </tr>
                  ) : (
                    savedPeriods.map((period, index) => {
                      const month = account.months[period];
                      const cumulative = savedPeriods
                        .slice(0, index + 1)
                        .reduce(
                          (sum, key) => sum + account.months[key].credits,
                          0,
                        );
                      return (
                        <tr key={period}>
                          <td className="left">
                            <strong>{monthName(period)}</strong>
                          </td>
                          <td>{month.days}</td>
                          <td>{formatNumber(month.credits)}</td>
                          <td>{formatNumber(cumulative)}</td>
                          <td>
                            {new Date(month.savedAt).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "short" },
                            )}
                          </td>
                          <td>
                            <button
                              className="remove-button"
                              type="button"
                              onClick={() => removeMonth(period)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="left">Saved Total</td>
                    <td />
                    <td>{formatNumber(savedTotal)}</td>
                    <td />
                    <td />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
          <section className="card terms-card">
            <div className="card-heading">
              <h2>Rate Card And Terms</h2>
              <span className="terms-version">
                {profile.rateCard.version}
                {formatIsoDate(profile.rateCard.effectiveDate) &&
                  ` · Effective ${formatIsoDate(profile.rateCard.effectiveDate)}`}
              </span>
            </div>
            <div className="terms-notice">
              <InfoIcon width={16} height={16} />
              <p>
                <strong>For calculation purposes only.</strong> Treat these
                numbers as planning estimates. They aren't a billing statement,
                a contract or a legal document, and no legal or financial
                liability is accepted for decisions made on them. Check anything
                that matters against your rate card and Order Form, or with your
                account team.
              </p>
            </div>
            <div className="terms-links">
              <a
                className="terms-link"
                href={profile.rateCard.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon width={13} height={13} />
                Official Rate Card
              </a>
              {profile.rateCard.documentationUrls?.map((doc) => (
                <a
                  className="terms-link"
                  key={doc.url}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon width={13} height={13} />
                  {doc.label}
                </a>
              ))}
            </div>
            <ul className="terms-list">
              {profile.disclaimers.map((disclaimer) => (
                <li key={disclaimer}>{disclaimer}</li>
              ))}
            </ul>
            <div className="terms-affiliation" role="note">
              <InfoIcon width={16} height={16} />
              <p>
                <strong>Independent tool.</strong> This tool isn't affiliated
                with, endorsed by, or sponsored by MuleSoft or Salesforce.
                MuleSoft and Salesforce are trademarks of their respective
                owners.
              </p>
            </div>
          </section>
          <footer className="app-footer">
            Developed by Tanupam Saha ·{" "}
            <a
              href="https://github.com/tanupam-CCI"
              target="_blank"
              rel="noreferrer"
            >
              GitHub @tanupam-CCI
            </a>{" "}
            · © 2026 ·{" "}
            <a
              href="https://github.com/tanupam-CCI/Credit-Consumption-Calculator/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
            >
              MIT License
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
