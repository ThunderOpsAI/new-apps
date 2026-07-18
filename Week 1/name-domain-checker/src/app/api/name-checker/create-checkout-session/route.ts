import { NextRequest, NextResponse } from "next/server";
import { getReportById } from "@/lib/storage";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { reportId?: string; plan?: string };
    if (!body.reportId) {
      throw new Error("Missing report ID.");
    }

    const report = await getReportById(body.reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (report.paymentStatus !== "free") {
      return NextResponse.json({
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tools/business-name-checker/results/${report.id}`,
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to enable checkout.");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Business Name + Domain Report",
              description: "Unlock all 20 generated business names and full domain results.",
            },
            unit_amount: 900,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/tools/business-name-checker/results/${report.id}?checkout=success`,
      cancel_url: `${baseUrl}/tools/business-name-checker/results/${report.id}?checkout=cancelled`,
      metadata: {
        reportId: report.id,
        plan: body.plan ?? "one_off",
      },
      customer_email: report.email,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create checkout session.",
      },
      { status: 400 },
    );
  }
}
