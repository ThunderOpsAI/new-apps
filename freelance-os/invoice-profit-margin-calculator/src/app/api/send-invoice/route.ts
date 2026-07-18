import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Resend is not configured in this MVP scaffold. Add RESEND_API_KEY and a sending implementation before enabling email."
    },
    { status: 501 }
  );
}
