import { NextRequest, NextResponse } from "next/server";
import { 
  translateTextServer, 
  translateTextsServer, 
  translatePageContent,
  SupportedLanguage, 
  SUPPORTED_LANGUAGES 
} from "@/lib/global-translate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLanguage, sourceLanguage = "auto" } = body;

    // Validate target language
    if (!targetLanguage || !SUPPORTED_LANGUAGES[targetLanguage as SupportedLanguage]) {
      return NextResponse.json(
        { error: "Invalid or unsupported target language" },
        { status: 400 }
      );
    }

    // Handle single text translation
    if (text && typeof text === "string") {
      const result = await translateTextServer(text, targetLanguage, sourceLanguage);
      return NextResponse.json({ 
        success: true, 
        data: result 
      });
    }

    // Handle multiple texts translation
    if (texts && Array.isArray(texts)) {
      const results = await translateTextsServer(texts, targetLanguage, sourceLanguage);
      return NextResponse.json({ 
        success: true, 
        data: results 
      });
    }

    // Handle page content translation request
    if (body.pageContent === true) {
      // This would be handled client-side, but we can validate the request
      return NextResponse.json({
        success: true,
        message: "Page content translation should be handled client-side using translatePageContent function"
      });
    }

    return NextResponse.json(
      { error: "Missing 'text' or 'texts' in request body" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { 
        error: "Translation failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return supported languages and available languages
  return NextResponse.json({
    success: true,
    data: {
      supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
      availableLanguages: Object.values(SUPPORTED_LANGUAGES),
      features: [
        "Real-time text translation",
        "Batch text translation", 
        "Client-side page content translation",
        "Smart caching with expiry",
        "Language auto-detection",
      ]
    }
  });
}
