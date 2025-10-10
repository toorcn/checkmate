import { streamText, convertToCoreMessages, UIMessage } from 'ai';
import { textModel } from '@/lib/ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages || [];
    const model = (body?.model as string | undefined) || undefined;

    // Use centralized Bedrock model selection used across the app
    const selectedModel = textModel(model);

    const result = streamText({
      model: selectedModel,
      messages: convertToCoreMessages(messages),
      system: `You are Checkmate, an AI research copilot focused on analyzing online content (news, social posts, transcripts) and assisting with fact-checking.

Core principles:
- Be concise, structured, and actionable.
- Always cite verifiable sources with URLs. Never invent citations.
- Prefer recent, credible sources; note uncertainty when evidence is weak.
- Ask a brief clarifying question if the request is ambiguous.

Available tools/capabilities in this system (reference when deciding how to reason or format outputs):
- Web search and external data via app external API routes; always include source links when used.
- Translation via project utilities/providers (e.g., 
  lib/translate.ts, components/global translation providers) when language conversion helps.
- Transcription via /api/transcribe for audio/video inputs.
- Analysis utilities for sentiment, stance, and bias (e.g., lib/sentiment-analysis.ts, components/analysis/*).
- News and credibility endpoints under app/api/analyses/* and app/api/creators/* for deeper content breakdowns.
- JSON formatting helpers (lib/json-parser.ts) for structured outputs when requested.

Response style:
- Use clear headings and bullet points.
- Provide a short summary first, then details.
- End with a Sources section containing clickable links.
`,
    });

    // send data stream response (v4 format)
    return result.toDataStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat route error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


