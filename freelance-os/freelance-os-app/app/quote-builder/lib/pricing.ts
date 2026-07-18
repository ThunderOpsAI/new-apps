export function calculateQuote(input: {
  estimated_hours: number;
  hourly_rate: number;
  desired_margin: number;
  buffer_percentage: number;
}) {
  const labour_cost = input.estimated_hours * input.hourly_rate;
  const buffer_amount = labour_cost * (input.buffer_percentage / 100);
  const total_cost = labour_cost + buffer_amount;
  const margin_amount = total_cost * (input.desired_margin / 100);
  const recommended_price = total_cost + margin_amount;
  const effective_hourly_rate = input.estimated_hours > 0 ? recommended_price / input.estimated_hours : 0;

  return {
    labour_cost,
    buffer_amount,
    total_cost,
    margin_amount,
    recommended_price,
    effective_hourly_rate
  };
}
