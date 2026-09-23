import { useEffect, useMemo, useState } from "react";
import {
  MissingRateDataError,
  type PricingModel,
  type UsageType,
} from "../domain";
import { defaultProviderId, providerRegistry } from "../app/registry";

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
            : "[NEEDS DATA: pricing could not be calculated]",
      };
    }
  }
  const priced = useMemo(price, [account.inputs, days, profile, usageTypes]);
  const total = priced.result?.total ?? 0;
  const remaining = account.total - account.consumed - total;
  const utilization = account.total
    ? (account.consumed + total) / account.total
    : 0;
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
    const rows = [
      ["Credit Consumption Calculator"],
      ["Month", monthName(account.period)],
      ["Total credits", account.total],
      ["Consumed to date", account.consumed],
      ["Calculated", total],
      ["Remaining", remaining],
      ["Order End Date", account.endDate],
      [],
      ["Usage type", "Input", "Monthly units", "Credits"],
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
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit-consumption-${account.period.replace("-", "")}.csv`;
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Credit Consumption Calculator</div>
        <nav className="subscription-nav" aria-label="Subscriptions">
          <h2>Subscriptions</h2>
          {[...providerRegistry.values()].map((item) => (
            <button
              className={`nav-item${item.id === provider.id ? " active" : ""}`}
              type="button"
              key={item.id}
              onClick={() => setProviderId(item.id)}
            >
              {item.displayName}
            </button>
          ))}
        </nav>
        <div className="sidebar-links">
          <a
            href="https://anypoint.mulesoft.com/usage-reports/"
            target="_blank"
            rel="noreferrer"
          >
            Anypoint Usage Reports
          </a>
          <a
            href="https://help.salesforce.com/s/articleView?id=xcloud.wallet_access.htm&type=5"
            target="_blank"
            rel="noreferrer"
          >
            Salesforce Digital Wallet
          </a>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <h1>{provider.displayName}</h1>
        </header>
        <div className="workspace-content">
          {provider.models && (
            <section
              className="card model-card"
              aria-labelledby="credit-system-label"
            >
              <div className="model-label" id="credit-system-label">
                Credit system
              </div>
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
            </section>
          )}
          <section className="card controls-card">
            <div className="controls">
              <label className="control">
                <span>Calculation month</span>
                <input
                  type="month"
                  value={account.period}
                  onChange={(event) =>
                    updateAccount({
                      ...account,
                      period: event.target.value,
                      inputs: account.months[event.target.value]?.inputs ?? {},
                    })
                  }
                />
              </label>
              <label className="control">
                <span>Total credits</span>
                <input
                  type="number"
                  min="0"
                  value={account.total}
                  onChange={(event) =>
                    updateAccount({
                      ...account,
                      total: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </label>
              <label className="control">
                <span>Consumed credits</span>
                <input
                  type="number"
                  min="0"
                  value={account.consumed}
                  onChange={(event) =>
                    updateAccount({
                      ...account,
                      consumed: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                />
              </label>
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
            </div>
          </section>
          <section className="card summary-card">
            <div className="card-heading">
              <h2>Utilization summary</h2>
            </div>
            <div className="summary-row">
              <div>
                <strong
                  className={
                    remaining < 0
                      ? "negative"
                      : utilization >= 0.85
                        ? "warning"
                        : ""
                  }
                >
                  {formatNumber(remaining)}
                </strong>
                <span>credits remaining</span>
              </div>
              <dl>
                <div>
                  <dt>Calculated · {monthName(account.period)}</dt>
                  <dd>{formatNumber(total)}</dd>
                </div>
                <div>
                  <dt>Consumed to date</dt>
                  <dd>{formatNumber(account.consumed)}</dd>
                </div>
                <div>
                  <dt>Contract remaining</dt>
                  <dd>{contractRemaining(account.endDate)}</dd>
                </div>
              </dl>
            </div>
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
            <div className="legend">
              <span>{formatNumber(account.consumed)} consumed</span>
              <span>{formatNumber(total)} this month (calculated)</span>
            </div>
          </section>
          <section className="card usage-card">
            <div className="card-heading">
              <h2>
                Usage this month{" "}
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
                  Load example figures
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => updateAccount({ ...account, inputs: {} })}
                >
                  Clear month
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={saveMonth}
                >
                  Save month
                </button>
              </div>
            </div>
            <p className="basis-note">
              <b>/day</b> meters are multiplied by the days in the selected
              month. <b>/month</b> meters use the month's figure directly.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="left">Usage type</th>
                    <th>Input</th>
                    <th>Monthly units</th>
                    <th>Top tier</th>
                    <th>Monthly credits</th>
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
                            value={input}
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
                    <td className="left">Calculated · this month</td>
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
              <strong>Price unavailable</strong>
              <span>{priced.error}</span>
            </section>
          )}
          <section className="card ledger-card">
            <div className="card-heading">
              <h2>Saved ledger</h2>
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
                        No saved months yet. Enter usage above and press Save
                        month.
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
                    <td className="left">Saved total</td>
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
          <section className="terms">
            <h2>Rate card and terms</h2>
            <p>
              Rate card:{" "}
              <a href={profile.rateCard.sourceUrl}>
                {profile.rateCard.sourceUrl}
              </a>
            </p>
            {profile.rateCard.documentationUrls?.map((url) => (
              <p key={url}>
                Documentation: <a href={url}>{url}</a>
              </p>
            ))}
            {profile.disclaimers.map((disclaimer) => (
              <p key={disclaimer}>{disclaimer}</p>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
