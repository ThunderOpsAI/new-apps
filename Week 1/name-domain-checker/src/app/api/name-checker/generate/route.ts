import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateBusinessNames } from "@/lib/ai";
import { checkDomainAvailability } from "@/lib/domain";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createReport } from "@/lib/storage";
import type { DomainCheckResult } from "@/lib/types";
import { validateReportInput } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const ipHash = createHash("sha256").update(forwardedFor).digest("hex");
    enforceRateLimit(ipHash);

    const payload = await request.json();
    const input = validateReportInput(payload);
    const aiOutput = await generateBusinessNames(input);

    const uniqueDomains = new Set(
      aiOutput.names.flatMap((item) =>
        item.domainCandidates.filter((candidate) =>
          input.extensions.some((extension) => candidate.endsWith(extension)),
        ),
      ),
    );

    const domainChecks = await Promise.all(
      [...uniqueDomains].map(async (domain) => {
        const result = await checkDomainAvailability(domain);
        return [domain, [result]] as [string, DomainCheckResult[]];
      }),
    );

    const report = await createReport(input, aiOutput, Object.fromEntries(domainChecks));

    return NextResponse.json({
      reportId: report.id,
      previewNames: report.aiOutput.names.slice(0, 5),
      lockedCount: 15,
      checkoutUrl: null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while generating your report. Please try again in a moment. You have not been charged.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
