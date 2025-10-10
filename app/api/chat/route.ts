import { streamText, convertToCoreMessages } from 'ai';
import { textModel } from '@/lib/ai';
import {
  analyzeContentSentiment,
  generateContentInsights,
  generateVideoSummary,
  detectNewsContent,
  researchAndFactCheck,
  generateCredibilityReport,
} from '@/tools';

// Allow streaming responses up to 59 seconds
export const maxDuration = 59;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages || [];
    const model = (body?.model as string | undefined) || undefined;

    // Use centralized Bedrock model selection used across the app
    const selectedModel = textModel(model);

    // Define ToolSet (name -> tool) as required by AI SDK types
    const tools = {
      analyzeContentSentiment,
      generateContentInsights,
      generateVideoSummary,
      detectNewsContent,
      researchAndFactCheck,
      generateCredibilityReport,
    };

    const result = streamText({
      model: selectedModel,
      messages: convertToCoreMessages(messages),
      maxSteps: 10,
      tools,
      system: `You are Checkmate, an AI Agent focused on analyzing  content (news, social posts, transcripts, rumours) and assisting with fact-checking.

Core principles:
- Be concise, structured, and actionable.
- Always cite verifiable sources with URLs. Never invent citations.
- Prefer recent, credible sources; note uncertainty when evidence is weak.
- Ask a brief clarifying question if the request is ambiguous.

Available tools in this system:
- Sentiment analysis via analyzeContentSentiment.
- Content insights via generateContentInsights.
- Video summarization via generateVideoSummary.
- News detection via detectNewsContent.
- Web research and fact-checking via researchAndFactCheck.
- Credibility reports via generateCredibilityReport.

Response style:
- Use clear headings and bullet points.
- Provide a short summary first, then details.
- End with a Sources section containing clickable links.

Tool visibility and formatting (critical):
- When you invoke a tool, emit a visible marker in your response so the UI can render it:
  - Before the tool runs, add a block: <tool name="TOOL_NAME">\n{JSON_ARGS}\n</tool>
  - After the tool completes, add a block: <tool-result name="TOOL_NAME">\n{JSON_RESULT}\n</tool-result>
- Keep these blocks concise; include only relevant arguments/results. Do not include secrets or tokens.
- Continue your normal user-facing explanation outside these blocks.
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


