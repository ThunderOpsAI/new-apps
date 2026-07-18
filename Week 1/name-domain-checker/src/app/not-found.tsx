import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="panel max-w-xl p-8 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          That report does not exist.
        </h1>
        <p className="mt-4 text-base leading-7 muted">
          Generate a new report from the tool page or check that the URL is correct.
        </p>
        <Link className="button-primary mt-6" href="/tools/business-name-checker">
          Open the tool
        </Link>
      </div>
    </main>
  );
}
