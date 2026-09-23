import { useMemo, useState } from "react";
import { MissingRateDataError, type PricingProvider, type PriceResult } from "../domain";
import { defaultProviderId, providerRegistry } from "../app/registry";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const currencyFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function formatAmount(value: number, unit: PricingProvider["unit"]): string {
  return unit === "USD" ? currencyFormat.format(value) : `${numberFormat.format(value)} ${unit}`;
}

const shellItems = ["Home", "Portfolio", "Agents", "MCP Servers", "Model Proxies", "APIs", "Gateways"];
const platformGroups = [
  { title: "Governance", items: ["Cost Management", "Security", "Governance Strategies"] },
  { title: "Observability", items: ["Performance", "Notifications"] },
  { title: "Platform", items: ["Providers"] },
];

export function App() {
  const [providerId, setProviderId] = useState(defaultProviderId);
  const provider = providerRegistry.get(providerId) ?? [...providerRegistry.values()][0];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const usageTypes = provider.usageTypes();

  const totals = useMemo(() => result?.lines ?? [], [result]);
  function selectProvider(id: string) {
    setProviderId(id);
    setQuantities({});
    setResult(null);
    setError(null);
  }
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
  function clearUsage() {
    setQuantities({});
    setResult(null);
    setError(null);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="mulesoft-mark">⌁</span><span>MuleSoft</span></div>
      <button className="search-button" type="button"><span>⌕</span> Search <kbd>/</kbd></button>
      <nav aria-label="Main navigation" className="main-nav">{shellItems.map((item, index) => <button className={`nav-item${index === 0 ? " active" : ""}`} type="button" key={item}><span aria-hidden="true">{index === 0 ? "⌂" : "◉"}</span>{item}</button>)}</nav>
      <section className="nav-group subscription-group"><h2>Subscriptions</h2>{[...providerRegistry.values()].map((item) => <button className={`nav-item subscription-item${item.id === provider.id ? " active" : ""}`} type="button" key={item.id} onClick={() => selectProvider(item.id)}><span aria-hidden="true">{item.unit === "USD" ? "$" : "◈"}</span>{item.displayName}</button>)}</section>
      {platformGroups.map((group) => <section className="nav-group" key={group.title}><h2>{group.title}</h2>{group.items.map((item) => <button className="nav-item" type="button" key={item}><span aria-hidden="true">◉</span>{item}</button>)}</section>)}
      <div className="sidebar-footer"><button className="platform-link" type="button">↗ Go to Anypoint Platform</button><button className="workspace-switcher" type="button">▣ Carlton Packaging <span>⌄</span></button><span className="user-badge" aria-label="Tanupam Saha">T</span></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><h1>Welcome, Tanupam!</h1><button className="add-services" type="button">+ Add services <span>⌄</span></button></header>
      <div className="workspace-content">
        <section className="overview-band" aria-labelledby="overview-title"><div className="section-title"><h2 id="overview-title">Consumption overview</h2><span className="info-dot" aria-label="Summary from the active rate card">i</span></div><div className="summary-grid"><article className="summary-card"><span>Usage types</span><strong>{numberFormat.format(usageTypes.length)}</strong><small>Available for {provider.displayName}</small></article><article className="summary-card"><span>Rate card</span><strong>{provider.rateCard.version}</strong><small>Effective {provider.rateCard.effectiveDate}</small></article><article className="summary-card"><span>Pricing unit</span><strong>{provider.unit}</strong><small>Active subscription model</small></article></div></section>
        <section className="calculator-section" aria-labelledby="calculator-title"><div className="section-title calculator-heading"><div><h2 id="calculator-title">Credit consumption</h2><p>Price billable usage from Anypoint Usage Reports.</p></div><button className="text-button" type="button" onClick={loadExamples}>Load example figures</button></div><div className="calculator-layout"><section className="usage-panel" aria-labelledby="usage-title"><div className="panel-heading"><h3 id="usage-title">Usage inputs</h3><span>{provider.displayName}</span></div><div className="usage-grid">{usageTypes.map((usageType) => <label className="usage-field" key={usageType.id}><span>{usageType.label}</span><small>{usageType.basis}{usageType.hint ? `: ${usageType.hint}` : ""}</small><input aria-label={usageType.label} type="number" min="0" step="1" value={quantities[usageType.id] ?? ""} onChange={(event) => updateQuantity(usageType.id, event.target.value)} /></label>)}</div><div className="actions"><button className="button primary" type="button" onClick={calculate}>Calculate price</button><button className="button secondary" type="button" onClick={clearUsage}>Clear usage</button></div></section><aside className="result-panel" aria-live="polite"><div className="panel-heading"><h3>Calculated total</h3><span>{provider.unit}</span></div>{error ? <div className="notice" role="alert"><strong>Price unavailable</strong><span>{error}</span></div> : result ? <><div className="total">{formatAmount(result.total, result.unit)}</div><div className="line-list">{totals.map((line) => <div className="line" key={line.usageTypeId}><span>{usageTypes.find((item) => item.id === line.usageTypeId)?.label ?? line.usageTypeId}</span><strong>{formatAmount(line.amount, result.unit)}</strong></div>)}</div></> : <p className="empty-result">Enter usage values to calculate a total.</p>}</aside></div></section>
        <section className="rate-card-section" aria-labelledby="rate-card-title"><div className="section-title"><h2 id="rate-card-title">Rate card and terms</h2></div><p>Rate card: <a href={provider.rateCard.sourceUrl.startsWith("http") ? provider.rateCard.sourceUrl : undefined}>{provider.rateCard.sourceUrl}</a></p>{provider.rateCard.documentationUrls?.map((url) => <p key={url}>Documentation: <a href={url}>{url}</a></p>)}{provider.disclaimers.map((disclaimer) => <p key={disclaimer}>{disclaimer}</p>)}</section>
      </div>
    </main>
  </div>;
}
