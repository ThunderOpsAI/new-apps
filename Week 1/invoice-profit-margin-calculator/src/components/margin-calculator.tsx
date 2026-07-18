"use client";

import { useState } from "react";

import { calculateSellPriceKnown, calculateTargetMargin } from "@/lib/calculations";

const fieldClass = "rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-sm outline-none transition focus:border-[var(--accent)]";

export function MarginCalculator() {
  const [mode, setMode] = useState<"known" | "target">("known");
  const [knownForm, setKnownForm] = useState({
    sellPrice: 120,
    cost: 42,
    feePercentage: 2.9,
    fixedFee: 0.3,
    shippingCost: 6,
    taxRate: 10
  });
  const [targetForm, setTargetForm] = useState({
    cost: 42,
    targetMarginPercentage: 35,
    feePercentage: 2.9,
    fixedFee: 0.3,
    shippingCost: 6
  });

  const known = calculateSellPriceKnown(knownForm);
  const target = calculateTargetMargin(targetForm);

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Profit margin calculator</p>
            <h1>Price work and products without guessing</h1>
          </div>
          <div className="tab-switch">
            <button className={mode === "known" ? "tab active" : "tab"} onClick={() => setMode("known")} type="button">
              Sell price known
            </button>
            <button className={mode === "target" ? "tab active" : "tab"} onClick={() => setMode("target")} type="button">
              Target margin
            </button>
          </div>
        </div>

        {mode === "known" ? (
          <div className="form-grid">
            {Object.entries(knownForm).map(([key, value]) => (
              <label className="stack" key={key}>
                <span className="label">{key}</span>
                <input
                  className={fieldClass}
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(event) =>
                    setKnownForm((current) => ({
                      ...current,
                      [key]: Number(event.target.value)
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : (
          <div className="form-grid">
            {Object.entries(targetForm).map(([key, value]) => (
              <label className="stack" key={key}>
                <span className="label">{key}</span>
                <input
                  className={fieldClass}
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(event) =>
                    setTargetForm((current) => ({
                      ...current,
                      [key]: Number(event.target.value)
                    }))
                  }
                />
              </label>
            ))}
          </div>
        )}
      </section>

      <aside className="panel preview">
        <p className="eyebrow">Results</p>
        {mode === "known" ? (
          <div className="metric-list">
            <div><span>Net revenue</span><strong>${known.netRevenue.toFixed(2)}</strong></div>
            <div><span>Total cost</span><strong>${known.totalCost.toFixed(2)}</strong></div>
            <div><span>Gross profit</span><strong>${known.grossProfit.toFixed(2)}</strong></div>
            <div><span>Net profit</span><strong>${known.netProfit.toFixed(2)}</strong></div>
            <div><span>Margin</span><strong>{known.margin.toFixed(2)}%</strong></div>
            <div><span>Markup</span><strong>{known.markup.toFixed(2)}%</strong></div>
            <div><span>Status</span><strong>{known.status}</strong></div>
          </div>
        ) : (
          <div className="metric-list">
            <div><span>Minimum sell price</span><strong>${target.minimumSellPrice.toFixed(2)}</strong></div>
            <div><span>Rounded sell price</span><strong>${target.roundedSellPrice.toFixed(2)}</strong></div>
            <div><span>Expected profit</span><strong>${target.expectedProfit.toFixed(2)}</strong></div>
          </div>
        )}
      </aside>
    </div>
  );
}
