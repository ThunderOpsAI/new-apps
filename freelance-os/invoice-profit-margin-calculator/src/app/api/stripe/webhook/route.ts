import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Stripe webhook is not configured in this scaffold. Add signature verification and persistence before launch."
    },
    { status: 501 }
  );
}
