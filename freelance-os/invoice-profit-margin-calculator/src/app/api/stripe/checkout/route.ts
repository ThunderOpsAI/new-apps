import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Stripe checkout is not configured in this scaffold. Add Stripe keys, a price id, and entitlement persistence before launch."
    },
    { status: 501 }
  );
}
