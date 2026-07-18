import { InvoiceLineItem } from "@/types/invoice";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateRevenue = (quantity: number, unitPrice: number) =>
  round(quantity * unitPrice);

export const calculateCost = (quantity: number, unitCost: number) =>
  round(quantity * unitCost);

export const calculateProfit = (revenue: number, cost: number) => round(revenue - cost);

export const calculateMarginPercentage = (profit: number, revenue: number) =>
  revenue <= 0 ? 0 : round((profit / revenue) * 100);

export const calculateMarkupPercentage = (profit: number, cost: number) =>
  cost <= 0 ? 0 : round((profit / cost) * 100);

export const calculateTax = (subtotal: number, taxRate: number) =>
  round(subtotal * (taxRate / 100));

export const calculateLineItem = (item: InvoiceLineItem) => {
  const revenue = calculateRevenue(item.quantity, item.unitPrice);
  const cost = calculateCost(item.quantity, item.unitCost);
  const profit = calculateProfit(revenue, cost);
  const tax = calculateTax(revenue, item.taxRate);

  return {
    revenue,
    cost,
    profit,
    tax,
    margin: calculateMarginPercentage(profit, revenue),
    markup: calculateMarkupPercentage(profit, cost)
  };
};

export const calculateInvoiceTotals = (items: InvoiceLineItem[]) => {
  const lines = items.map((item) => ({ ...item, ...calculateLineItem(item) }));
  const subtotal = round(lines.reduce((sum, item) => sum + item.revenue, 0));
  const taxTotal = round(lines.reduce((sum, item) => sum + item.tax, 0));
  const total = round(subtotal + taxTotal);
  const totalCost = round(lines.reduce((sum, item) => sum + item.cost, 0));
  const totalProfit = calculateProfit(subtotal, totalCost);
  const margin = calculateMarginPercentage(totalProfit, subtotal);

  return {
    lines,
    subtotal,
    taxTotal,
    total,
    totalCost,
    totalProfit,
    margin
  };
};

export const calculateSellPriceKnown = ({
  sellPrice,
  cost,
  feePercentage,
  fixedFee = 0,
  shippingCost = 0,
  taxRate = 0
}: {
  sellPrice: number;
  cost: number;
  feePercentage: number;
  fixedFee?: number;
  shippingCost?: number;
  taxRate?: number;
}) => {
  const feeAmount = round(sellPrice * (feePercentage / 100) + fixedFee);
  const taxAmount = round(sellPrice * (taxRate / 100));
  const netRevenue = round(sellPrice - feeAmount - taxAmount);
  const totalCost = round(cost + shippingCost);
  const grossProfit = round(sellPrice - totalCost);
  const netProfit = round(netRevenue - totalCost);
  const margin = calculateMarginPercentage(netProfit, sellPrice);
  const markup = calculateMarkupPercentage(netProfit, totalCost);

  let status = "Strong margin";
  if (netProfit < 0) {
    status = "Losing money";
  } else if (margin < 10) {
    status = "Weak margin";
  } else if (margin < 20) {
    status = "Acceptable margin";
  }

  return {
    feeAmount,
    taxAmount,
    netRevenue,
    totalCost,
    grossProfit,
    netProfit,
    margin,
    markup,
    status
  };
};

export const calculateTargetMargin = ({
  cost,
  targetMarginPercentage,
  feePercentage = 0,
  fixedFee = 0,
  shippingCost = 0
}: {
  cost: number;
  targetMarginPercentage: number;
  feePercentage?: number;
  fixedFee?: number;
  shippingCost?: number;
}) => {
  const targetMargin = targetMarginPercentage / 100;
  const totalCost = round(cost + shippingCost + fixedFee);
  const feeMultiplier = 1 - feePercentage / 100;
  const denominator = feeMultiplier - targetMargin;

  if (denominator <= 0) {
    return {
      minimumSellPrice: 0,
      roundedSellPrice: 0,
      expectedProfit: 0
    };
  }

  const minimumSellPrice = round(totalCost / denominator);
  const roundedSellPrice = Math.ceil(minimumSellPrice);
  const postFeeRevenue = round(roundedSellPrice * feeMultiplier);
  const expectedProfit = round(postFeeRevenue - totalCost);

  return {
    minimumSellPrice,
    roundedSellPrice,
    expectedProfit
  };
};
