import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { ExternalLink, Code, Zap, Shield, Globe } from "lucide-react";

export default async function ApiPage() {
  const auth = await getAuthContext();
  
  if (!auth) {
    redirect("/sign-in");
  }

  const apiKey = "demo-key-123"; // Shared API key for all users
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://checkmate.asia";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">External API</h1>
        <p className="text-muted-foreground">
          Access Checkmate's content analysis, transcription, and fact-checking services programmatically.
        </p>
      </div>

      {/* API Key Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your API Key
          </CardTitle>
          <CardDescription>
            Use this API key to authenticate your requests to the Checkmate External API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={apiKey}
              readOnly
              className="font-mono text-sm"
            />
            <CopyButton text={apiKey} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Rate limit: 100 requests per hour
          </p>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started with the Checkmate API in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Test the API</h4>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">
                curl -H "X-API-Key: {apiKey}" {baseUrl}/api/external
              </code>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Transcribe Content</h4>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">
                curl -X POST {baseUrl}/api/external/transcribe \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                &nbsp;&nbsp;-H "X-API-Key: {apiKey}" \<br />
                &nbsp;&nbsp;-d '{`{"videoUrl": "https://example.com/video.mp4"}`}'
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Available Endpoints
          </CardTitle>
          <CardDescription>
            All endpoints require the X-API-Key header for authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Content Transcription</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-sm">{baseUrl}/api/external/transcribe</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Analyze and transcribe content from TikTok, Twitter, web articles, or video URLs.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Text Translation</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-sm">{baseUrl}/api/external/translate</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Translate text between supported languages with high accuracy.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Content Analyses</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="text-sm">{baseUrl}/api/external/analyses</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-sm">{baseUrl}/api/external/analyses</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Retrieve or create content analyses with fact-checking results.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Crowdsource Voting</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="text-sm">{baseUrl}/api/external/crowdsource/vote</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="text-sm">{baseUrl}/api/external/crowdsource/vote</code>
              </div>
              <p className="text-sm text-muted-foreground">
                Submit votes on content credibility and retrieve vote counts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Examples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            SDK Examples
          </CardTitle>
          <CardDescription>
            Code examples for popular programming languages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">JavaScript/Node.js</h4>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`const API_KEY = '${apiKey}';
const BASE_URL = '${baseUrl}/api/external';

async function transcribeContent(url) {
  const response = await fetch(\`\${BASE_URL}/transcribe\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ videoUrl: url })
  });
  
  return await response.json();
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Python</h4>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`import requests

API_KEY = '${apiKey}'
BASE_URL = '${baseUrl}/api/external'

def transcribe_content(url):
    response = requests.post(
        f'{BASE_URL}/transcribe',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        json={'videoUrl': url}
    )
    return response.json()`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Rate Limits & CORS
          </CardTitle>
          <CardDescription>
            Understanding API limits and cross-origin requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Rate Limits</h4>
            <div className="bg-muted p-4 rounded-lg">
              <ul className="text-sm space-y-1">
                <li>• <strong>Free Tier:</strong> 100 requests per hour</li>
                <li>• Rate limit headers included in responses</li>
                <li>• <code>X-RateLimit-Remaining</code>: Remaining requests</li>
                <li>• <code>X-RateLimit-Reset</code>: Reset time (ISO timestamp)</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">CORS Support</h4>
            <div className="bg-muted p-4 rounded-lg">
              <ul className="text-sm space-y-1">
                <li>• <strong>Allowed Origins:</strong> *</li>
                <li>• <strong>Allowed Methods:</strong> GET, POST, PUT, DELETE, OPTIONS</li>
                <li>• <strong>Allowed Headers:</strong> Content-Type, Authorization, X-API-Key</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Full Documentation
          </CardTitle>
          <CardDescription>
            Complete API reference and examples.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/docs/EXTERNAL_API.md" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Documentation
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
