import { OutreachClient } from "./OutreachClient";

type OutreachPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function OutreachPage({ searchParams }: OutreachPageProps) {
  return <OutreachClient initialSearchParams={searchParams} />;
}
