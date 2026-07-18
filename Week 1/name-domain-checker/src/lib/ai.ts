import { validateGeneratedNames } from "@/lib/validation";
import type { GeneratedName, ReportInput } from "@/lib/types";

const prefixes = [
  "North",
  "Bright",
  "Forge",
  "True",
  "Launch",
  "Peak",
  "Kind",
  "Clear",
  "Pulse",
  "Drift",
];

const suffixes = [
  "Works",
  "Lane",
  "Nest",
  "Foundry",
  "Flow",
  "Hive",
  "Studio",
  "Bridge",
  "Labs",
  "Collective",
];

const altPrefixes = ["get", "try", "join", "hello", "go"];

function slugifyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function buildFallbackNames(input: ReportInput) {
  const keyword = input.industry.replace(/[^a-z0-9]+/gi, " ").trim();
  const words = keyword.split(/\s+/).filter(Boolean);
  const baseWord = words[0] || "venture";

  const names: GeneratedName[] = Array.from({ length: 20 }, (_, index) => {
    const prefix = prefixes[index % prefixes.length];
    const suffix = suffixes[(index * 3) % suffixes.length];
    const variant = index % 4 === 0 ? `${prefix}${baseWord}` : `${prefix}${suffix}`;
    const brand = variant.replace(/\s+/g, "");
    const handle = slugifyName(brand);

    return {
      name: brand,
      rationale: `Blends a ${input.tone.toLowerCase()} tone with a clear ${input.industry.toLowerCase()} signal for early customer trust.`,
      tagline: `${input.tone} positioning for ${input.industry.toLowerCase()} buyers.`,
      toneFit: input.tone,
      bestFor: input.industry,
      domainCandidates: [
        `${handle}.com`,
        `${handle}${input.country?.toLowerCase() === "au" ? ".com.au" : ".co"}`,
        `${altPrefixes[index % altPrefixes.length]}${handle}.com`,
      ],
    };
  });

  return { names };
}

async function generateWithOpenAI(input: ReportInput) {
  const prompt = `You are an expert brand naming strategist.

Generate exactly 20 business name ideas for this business.

Business idea: ${input.businessIdea}
Industry: ${input.industry}
Brand tone: ${input.tone}
Target market/country: ${input.country ?? "Global"}

Rules:
- Names must be short, memorable, pronounceable, and commercially plausible.
- Avoid names that are too similar to famous brands.
- Avoid legal guarantees or trademark claims.
- Include a mix of practical, premium, modern, and slightly creative names.
- For each name, include a short rationale, tagline, tone fit, best-use category, and 3-5 domain candidates.
- Domain candidates should include clean .com possibilities where possible, plus relevant alternatives such as .com.au, .ai, .io, or .co.

Return valid JSON only using this schema:
{
  "names": [
    {
      "name": "string",
      "rationale": "string",
      "tagline": "string",
      "toneFit": "string",
      "bestFor": "string",
      "domainCandidates": ["string"]
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Return strict JSON and no prose.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content);
}

export async function generateBusinessNames(input: ReportInput) {
  if (!process.env.OPENAI_API_KEY) {
    return validateGeneratedNames(buildFallbackNames(input));
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await generateWithOpenAI(input);
      return validateGeneratedNames(raw);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown AI generation error.");
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("AI generation failed.");
}
