import { describe, expect, it } from "vitest";

import {
  calculateInvoiceTotals,
  calculateLineItem,
  calculateMarginPercentage,
  calculateMarkupPercentage,
  calculateTargetMargin,
  calculateTax
} from "@/lib/calculations";

describe("calculations", () => {
  it("handles a normal profitable item", () => {
    const result = calculateLineItem({
      id: "1",
      description: "Website build",
      quantity: 2,
      unitPrice: 500,
      unitCost: 150,
      taxRate: 10
    });

    expect(result.revenue).toBe(1000);
    expect(result.cost).toBe(300);
    expect(result.profit).toBe(700);
    expect(result.margin).toBe(70);
    expect(result.markup).toBeCloseTo(233.33, 2);
  });

  it("handles a zero-cost item", () => {
    expect(calculateMarkupPercentage(100, 0)).toBe(0);
    expect(calculateMarginPercentage(100, 200)).toBe(50);
  });

  it("handles a loss-making item", () => {
    const result = calculateLineItem({
      id: "2",
      description: "Loss",
      quantity: 1,
      unitPrice: 100,
      unitCost: 180,
      taxRate: 0
    });

    expect(result.profit).toBe(-80);
    expect(result.margin).toBe(-80);
    expect(result.markup).toBeCloseTo(-44.44, 2);
  });

  it("calculates multiple invoice line items", () => {
    const result = calculateInvoiceTotals([
      {
        id: "1",
        description: "Design",
        quantity: 1,
        unitPrice: 250,
        unitCost: 80,
        taxRate: 10
      },
      {
        id: "2",
        description: "Development",
        quantity: 3,
        unitPrice: 400,
        unitCost: 120,
        taxRate: 0
      }
    ]);

    expect(result.subtotal).toBe(1450);
    expect(result.taxTotal).toBe(25);
    expect(result.total).toBe(1475);
    expect(result.totalCost).toBe(440);
    expect(result.totalProfit).toBe(1010);
  });

  it("calculates tax correctly", () => {
    expect(calculateTax(123.45, 10)).toBe(12.35);
  });

  it("calculates target margin pricing", () => {
    const result = calculateTargetMargin({
      cost: 40,
      targetMarginPercentage: 30,
      feePercentage: 5,
      fixedFee: 1,
      shippingCost: 4
    });

    expect(result.minimumSellPrice).toBeCloseTo(69.23, 2);
    expect(result.roundedSellPrice).toBe(70);
    expect(result.expectedProfit).toBeCloseTo(21.5, 2);
  });
});
