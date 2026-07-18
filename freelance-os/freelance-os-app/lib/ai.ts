export async function generateAI(params: { system: string; prompt: string; maxTokens?: number }) {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('AI generation failed');
  return res.json();
}
