"use client";

import { useState, useMemo } from "react";
import { QuoteInput, Package, Upsell } from "../lib/types";
import { calculateQuote } from "../lib/pricing";
import { useBriefs } from "@/app/brief-builder/hooks/useBriefs";
import { useQuotes } from "../hooks/useQuotes";
import { generateAI } from "@/lib/ai";

export default function QuoteBuilder() {
  const { briefs } = useBriefs();
  const { addQuote } = useQuotes();

  const [input, setInput] = useState<QuoteInput>({
    project_type: "",
    deliverables: "",
    estimated_hours: 0,
    hourly_rate: 0,
    desired_margin: 20,
    buffer_percentage: 15,
    complexity: "Medium",
    timeline: "",
    client_budget: null,
    revision_allowance: 2,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [pricingNotes, setPricingNotes] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<'Basic' | 'Standard' | 'Premium' | null>(null);
  const [linkedBriefId, setLinkedBriefId] = useState<string>("");

  const pricing = useMemo(() => calculateQuote(input), [input]);

  const handleImportBrief = (briefId: string) => {
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) return;
    
    setLinkedBriefId(briefId);
    setInput(prev => ({
      ...prev,
      project_type: brief.input.project_type || prev.project_type,
      deliverables: brief.scope.in_scope.join("\\n") || prev.deliverables,
      timeline: brief.input.timeline || prev.timeline,
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPackages([]);
    setUpsells([]);
    try {
      const system = `You are a freelance pricing strategist. Given project details, generate three pricing packages
(Basic, Standard, Premium) and upsell suggestions. Be realistic — do not suggest prices
below sustainable rates. Warn if scope seems underpriced. Write in client-friendly language.
Return only valid JSON matching this schema:
{
  "packages": [
    {
      "name": "Basic" | "Standard" | "Premium",
      "price": number,
      "deliverables": ["string"],
      "timeline": "string",
      "revision_limit": number,
      "payment_terms": "string",
      "best_fit": "string",
      "warning": "string | null"
    }
  ],
  "upsells": [
    {
      "name": "string",
      "price": number,
      "description": "string"
    }
  ],
  "pricing_notes": "string"
}`;

      const payload = {
        project_type: input.project_type,
        deliverables: input.deliverables,
        estimated_hours: input.estimated_hours,
        hourly_rate: input.hourly_rate,
        recommended_price: pricing.recommended_price,
        complexity: input.complexity,
        timeline: input.timeline,
        client_budget: input.client_budget,
        revision_allowance: input.revision_allowance,
      };

      const result = await generateAI({
        system,
        prompt: JSON.stringify(payload),
        maxTokens: 2000,
      });

      const parsed = JSON.parse(result.result);
      setPackages(parsed.packages || []);
      setUpsells(parsed.upsells || []);
      setPricingNotes(parsed.pricing_notes || "");
      setSelectedPackage('Standard'); // Standard is recommended
    } catch (err) {
      console.error(err);
      alert("Failed to generate packages. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (packages.length === 0) return;
    addQuote({
      linked_brief_id: linkedBriefId || undefined,
      input,
      packages,
      upsells,
      selected_package_name: selectedPackage,
      selected_upsells: [],
      pricing_notes: pricingNotes,
    });
    alert("Quote saved to CRM!");
  };

  return (
    <div className="shell">
      <div className="hero-card" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Quote & Package Builder</h1>
        <p className="page-subtitle">Calculate margins and generate tiered pricing packages for your clients.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Form */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="row row--between">
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Project Details</h2>
            {briefs.length > 0 && (
              <select 
                className="select" 
                style={{ width: "auto", minHeight: "36px", padding: "0 10px" }}
                onChange={e => handleImportBrief(e.target.value)}
                value={linkedBriefId}
              >
                <option value="">Import from Brief...</option>
                {briefs.map(b => (
                  <option key={b.id} value={b.id}>{b.input.client_name} - {b.input.project_type}</option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label>Project Type</label>
            <input className="input" value={input.project_type} onChange={e => setInput({...input, project_type: e.target.value})} placeholder="e.g. E-commerce Website" />
          </div>

          <div className="field">
            <label>Deliverables</label>
            <textarea className="textarea" value={input.deliverables} onChange={e => setInput({...input, deliverables: e.target.value})} placeholder="List key deliverables..." />
          </div>

          <div className="drawer-form-grid">
            <div className="field">
              <label>Estimated Hours</label>
              <input type="number" className="input" value={input.estimated_hours || ""} onChange={e => setInput({...input, estimated_hours: Number(e.target.value)})} />
            </div>
            <div className="field">
              <label>Hourly Rate (AUD)</label>
              <input type="number" className="input" value={input.hourly_rate || ""} onChange={e => setInput({...input, hourly_rate: Number(e.target.value)})} />
            </div>
            <div className="field">
              <label>Complexity</label>
              <select className="select" value={input.complexity} onChange={e => setInput({...input, complexity: e.target.value as any})}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Enterprise</option>
              </select>
            </div>
            <div className="field">
              <label>Timeline</label>
              <input className="input" value={input.timeline} onChange={e => setInput({...input, timeline: e.target.value})} placeholder="e.g. 4 weeks" />
            </div>
            <div className="field">
              <label>Client Budget</label>
              <input type="number" className="input" value={input.client_budget || ""} onChange={e => setInput({...input, client_budget: Number(e.target.value) || null})} placeholder="Optional" />
            </div>
            <div className="field">
              <label>Revision Allowance</label>
              <input type="number" className="input" value={input.revision_allowance} onChange={e => setInput({...input, revision_allowance: Number(e.target.value)})} />
            </div>
          </div>

          <div className="drawer-form-grid" style={{ marginTop: 8, padding: 16, background: "rgba(0,0,0,0.02)", borderRadius: 12 }}>
            <div className="field">
              <label>Buffer %</label>
              <input type="number" className="input" value={input.buffer_percentage} onChange={e => setInput({...input, buffer_percentage: Number(e.target.value)})} />
            </div>
            <div className="field">
              <label>Desired Margin %</label>
              <input type="number" className="input" value={input.desired_margin} onChange={e => setInput({...input, desired_margin: Number(e.target.value)})} />
            </div>
          </div>

          <button 
            className="button button--primary" 
            onClick={handleGenerate} 
            disabled={isGenerating || !input.project_type || !input.deliverables || input.estimated_hours <= 0 || input.hourly_rate <= 0}
            style={{ marginTop: 8 }}
          >
            {isGenerating ? "Generating..." : "Generate Packages"}
          </button>
        </div>

        {/* Right Column: Calculator & Packages */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Live Calculator */}
          <div className="panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Labour Cost</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>${pricing.labour_cost.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Buffer ({input.buffer_percentage}%)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>${pricing.buffer_amount.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Margin Amount ({input.desired_margin}%)</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>${pricing.margin_amount.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Recommended Price</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-deep)" }}>${pricing.recommended_price.toFixed(2)}</div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Effective Hourly Rate</div>
              <div style={{ 
                fontSize: "1.2rem", 
                fontWeight: 600,
                color: pricing.effective_hourly_rate > input.hourly_rate ? "var(--success-text)" : 
                       pricing.effective_hourly_rate === input.hourly_rate ? "var(--warning-text)" : "var(--danger-text)"
              }}>
                ${pricing.effective_hourly_rate.toFixed(2)} / hr
              </div>
            </div>
          </div>

          {/* Generated Packages */}
          {packages.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gap: "16px" }}>
                {packages.map((pkg, idx) => (
                  <div 
                    key={idx} 
                    className="panel" 
                    style={{ 
                      cursor: "pointer",
                      border: selectedPackage === pkg.name ? "2px solid var(--accent)" : undefined,
                      position: "relative"
                    }}
                    onClick={() => setSelectedPackage(pkg.name)}
                  >
                    {pkg.name === 'Standard' && (
                      <div style={{ position: "absolute", top: -12, right: 24, background: "var(--accent)", color: "white", padding: "4px 12px", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600 }}>
                        Recommended
                      </div>
                    )}
                    <div className="row row--between" style={{ marginBottom: 12 }}>
                      <h3 style={{ margin: 0 }}>{pkg.name}</h3>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>${pkg.price.toFixed(2)}</div>
                    </div>
                    {pkg.warning && (
                      <div style={{ background: "var(--warning-bg)", color: "var(--warning-text)", padding: "8px 12px", borderRadius: 8, fontSize: "0.85rem", marginBottom: 12 }}>
                        ⚠️ {pkg.warning}
                      </div>
                    )}
                    <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: 12 }}>{pkg.best_fit}</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.9rem", display: "grid", gap: 6 }}>
                      {pkg.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                    <div className="row" style={{ marginTop: 16, fontSize: "0.85rem", color: "var(--muted)", gap: 16 }}>
                      <div>⏱ {pkg.timeline}</div>
                      <div>🔄 {pkg.revision_limit} Revisions</div>
                    </div>
                  </div>
                ))}
              </div>

              {upsells.length > 0 && (
                <div className="panel">
                  <h3 style={{ margin: "0 0 16px 0" }}>Suggested Upsells</h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {upsells.map((u, i) => (
                      <div key={i} className="row row--between" style={{ padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{u.description}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>${u.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="row" style={{ marginTop: 8 }}>
                <button className="button button--primary" onClick={handleSave}>Save Quote</button>
                <button className="button button--ghost" onClick={() => alert("Copied to clipboard (stub)")}>Copy Quote</button>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--muted)" }}>
              {isGenerating ? "Generating packages..." : "Generate packages to see options"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
