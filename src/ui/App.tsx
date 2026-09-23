import { useMemo, useState } from "react";
import { MissingRateDataError, type PricingProvider, type PriceResult } from "../domain";
import { defaultProviderId, providerRegistry } from "../app/registry";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function formatAmount(value: number, unit: PricingProvider["unit"]): string {
  return unit === "USD" ? currencyFormat.format(value) : `${numberFormat.format(value)} ${unit}`;
}

export function App() {
  const [providerId, setProviderId] = useState(defaultProviderId);
  const provider = providerRegistry.get(providerId) ?? [...providerRegistry.values()][0];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usageTypes = provider.usageTypes();

  const totals = useMemo(() => result?.lines ?? [], [result]);
  function updateQuantity(id: string, value: string) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, Number(value) || 0) }));
    setResult(null);
    setError(null);
  }
  function calculate() {
    try {
      setResult(provider.price(quantities));
      setError(null);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof MissingRateDataError ? cause.message : "[NEEDS DATA: pricing could not be calculated]");
    }
  }
  function loadExamples() {
    setQuantities(Object.fromEntries(usageTypes.map((usageType) => [usageType.id, usageType.exampleQuantity ?? 0])));
    setResult(null);
    setError(null);
  }
  function selectProvider(id: string) {
    setProviderId(id);
    setQuantities({});
    setResult(null);
    setError(null);
  }

  return <main className="shell">
    <header className="brandbar"><div className="wordmark"><span className="mark" />Consumption calculator</div><div className="rate-meta">Rate card {provider.rateCard.version}<br />Effective {provider.rateCard.effectiveDate}</div></header>
    <section className="intro"><p className="eyebrow">Subscription pricing</p><h1>{provider.displayName}</h1><p>Enter usage for the selected subscription to calculate its total.</p></section>
    <section className="panel provider-panel" aria-labelledby="provider-heading">
      <div><h2 id="provider-heading">Subscription</h2><p className="hint">Choose a pricing model.</p></div>
      <label className="select-label">Subscription<select value={provider.id} onChange={(event) => selectProvider(event.target.value)}>{[...providerRegistry.values()].map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
    </section>
    <section className="usage-heading"><div><h2>Usage</h2><p>Values are priced using the selected rate card.</p></div><button className="button secondary" type="button" onClick={loadExamples}>Load example figures</button></section>
    <section className="panel usage-panel">
      <div className="usage-grid">{usageTypes.map((usageType) => <label className="usage-field" key={usageType.id}><span>{usageType.label}</span><small>{usageType.basis}{usageType.hint ? `: ${usageType.hint}` : ""}</small><input aria-label={usageType.label} type="number" min="0" step="1" value={quantities[usageType.id] ?? ""} onChange={(event) => updateQuantity(usageType.id, event.target.value)} /></label>)}</div>
      <div className="actions"><button className="button primary" type="button" onClick={calculate}>Calculate price</button><button className="button secondary" type="button" onClick={() => { setQuantities({}); setResult(null); setError(null); }}>Clear usage</button></div>
    </section>
    {error && <section className="notice" role="alert"><strong>Price unavailable</strong><span>{error}</span></section>}
    {result && <section className="result" aria-live="polite"><div><p className="eyebrow">Calculated total</p><div className="total">{formatAmount(result.total, result.unit)}</div></div><div className="line-list">{totals.map((line) => <div className="line" key={line.usageTypeId}><span>{usageTypes.find((item) => item.id === line.usageTypeId)?.label ?? line.usageTypeId}</span><strong>{formatAmount(line.amount, result.unit)}</strong></div>)}</div></section>}
    <section className="notes"><h2>Rate card and terms</h2><p>Source: <a href={provider.rateCard.sourceUrl.startsWith("http") ? provider.rateCard.sourceUrl : undefined}>{provider.rateCard.sourceUrl}</a></p>{provider.disclaimers.map((disclaimer) => <p key={disclaimer}>{disclaimer}</p>)}</section>
  </main>;
}
