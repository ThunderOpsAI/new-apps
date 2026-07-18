import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import type { ReportInput, ReportRecord } from "@/lib/types";

let pool: Pool | null = null;

function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  }

  return pool;
}

const localDataDir = path.join(process.cwd(), ".data");
const localDataFile = path.join(localDataDir, "name-checker-reports.json");

async function readLocalReports(): Promise<ReportRecord[]> {
  try {
    const raw = await readFile(localDataFile, "utf8");
    return JSON.parse(raw) as ReportRecord[];
  } catch {
    return [];
  }
}

async function writeLocalReports(reports: ReportRecord[]) {
  await mkdir(localDataDir, { recursive: true });
  await writeFile(localDataFile, JSON.stringify(reports, null, 2), "utf8");
}

function mapRowToReport(row: {
  id: string;
  created_at: string;
  email: string | null;
  business_idea: string;
  industry: string;
  tone: string;
  country: string | null;
  ai_output: ReportRecord["aiOutput"];
  domain_results: ReportRecord["domainResults"];
  payment_status: ReportRecord["paymentStatus"];
  stripe_session_id: string | null;
  unlock_token: string;
}): ReportRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    email: row.email ?? undefined,
    businessIdea: row.business_idea,
    industry: row.industry,
    tone: row.tone,
    country: row.country ?? undefined,
    aiOutput: row.ai_output,
    domainResults: row.domain_results,
    paymentStatus: row.payment_status,
    stripeSessionId: row.stripe_session_id ?? undefined,
    unlockToken: row.unlock_token,
  };
}

export async function createReport(
  input: ReportInput,
  aiOutput: ReportRecord["aiOutput"],
  domainResults: ReportRecord["domainResults"],
) {
  const report: ReportRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    email: input.email,
    businessIdea: input.businessIdea,
    industry: input.industry,
    tone: input.tone,
    country: input.country,
    aiOutput,
    domainResults,
    paymentStatus: "free",
    unlockToken: crypto.randomUUID(),
  };

  const db = getPool();
  if (!db) {
    const reports = await readLocalReports();
    reports.unshift(report);
    await writeLocalReports(reports);
    return report;
  }

  const result = await db.query(
    `insert into name_checker_reports
      (id, created_at, email, business_idea, industry, tone, country, ai_output, domain_results, payment_status, stripe_session_id, unlock_token)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12)
     returning *`,
    [
      report.id,
      report.createdAt,
      report.email ?? null,
      report.businessIdea,
      report.industry,
      report.tone,
      report.country ?? null,
      JSON.stringify(report.aiOutput),
      JSON.stringify(report.domainResults),
      report.paymentStatus,
      null,
      report.unlockToken,
    ],
  );

  return mapRowToReport(result.rows[0]);
}

export async function getReportById(id: string) {
  const db = getPool();
  if (!db) {
    const reports = await readLocalReports();
    return reports.find((report) => report.id === id) ?? null;
  }

  const result = await db.query("select * from name_checker_reports where id = $1 limit 1", [id]);
  return result.rowCount ? mapRowToReport(result.rows[0]) : null;
}

export async function markReportPaid(id: string, stripeSessionId?: string) {
  const db = getPool();
  if (!db) {
    const reports = await readLocalReports();
    const updated = reports.map((report) =>
      report.id === id
        ? {
            ...report,
            paymentStatus: "paid" as const,
            stripeSessionId: stripeSessionId ?? report.stripeSessionId,
          }
        : report,
    );
    await writeLocalReports(updated);
    return updated.find((report) => report.id === id) ?? null;
  }

  const result = await db.query(
    `update name_checker_reports
     set payment_status = 'paid',
         stripe_session_id = coalesce($2, stripe_session_id)
     where id = $1
     returning *`,
    [id, stripeSessionId ?? null],
  );

  return result.rowCount ? mapRowToReport(result.rows[0]) : null;
}
