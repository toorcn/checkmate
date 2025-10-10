import { streamText, type UIMessage } from 'ai';
import { textModel } from '@/lib/ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages || []) as UIMessage[];
    const model = (body?.model as string | undefined) || undefined;

    // Use centralized Bedrock model selection used across the app
    const selectedModel = textModel(model);

    const result = streamText({
      model: selectedModel,
      messages,
      system:
        'You are a helpful assistant that can answer questions and help with tasks about recent news. Cite sources when relevant.',
    });

    // send sources and reasoning back to the client
    return result.toDataStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat route error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


