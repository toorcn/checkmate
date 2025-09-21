'use client';

import { OriginTracingDiagram } from './origin-tracing-diagram';

/**
 * Demo component showing how the Origin Tracing Diagram would look
 * with realistic fact-checking data
 */
export function OriginTracingDemo() {
  const demoData = {
    originTracing: {
      hypothesizedOrigin: "Originally posted on a 4chan /pol/ conspiracy thread claiming that COVID-19 vaccines contain microchips for government tracking.",
      firstSeenDates: [
        { source: "4chan /pol/", date: "2021-03-15", url: "https://example.com/thread1" },
        { source: "Reddit r/conspiracy", date: "2021-03-16", url: "https://reddit.com/r/conspiracy/example" },
        { source: "Facebook groups", date: "2021-03-17" },
        { source: "Twitter/X", date: "2021-03-18" }
      ],
      propagationPaths: [
        "Facebook groups",
        "YouTube influencers", 
        "TikTok creators",
        "Telegram channels"
      ],
      evolutionSteps: [
        {
          platform: "Facebook groups",
          transformation: "Claim evolved to include specific vaccine manufacturers and added false claims about DNA alteration",
          impact: "Reached 50,000+ members across anti-vaccine groups",
          date: "2021-03-17"
        },
        {
          platform: "YouTube influencers",
          transformation: "Video content added visual 'evidence' with misleading microscopy images",
          impact: "Videos gained 2M+ views before removal",
          date: "2021-03-20"
        },
        {
          platform: "TikTok creators",
          transformation: "Shortened to catchy phrases like '#ChipFree' and '#VaccineChoice' with emotional personal stories",
          impact: "Hashtag used in 100,000+ posts",
          date: "2021-03-25"
        },
        {
          platform: "Telegram channels",
          transformation: "Combined with other conspiracy theories about 5G networks and government surveillance",
          impact: "Shared across 200+ channels with 500K+ subscribers",
          date: "2021-04-01"
        }
      ]
    },
    beliefDrivers: [
      {
        name: "Confirmation Bias",
        description: "People who already distrust vaccines seek information that confirms their existing beliefs",
        references: [
          { title: "Confirmation Bias Research", url: "https://example.com/research1" }
        ]
      },
      {
        name: "Availability Heuristic", 
        description: "Recent privacy concerns about tech companies make tracking claims seem more plausible",
        references: []
      },
      {
        name: "Social Proof",
        description: "Seeing others share anti-vaccine content creates perception of widespread belief",
        references: []
      }
    ],
    sources: [
      {
        url: "https://snopes.com/example",
        title: "COVID-19 Vaccines Do Not Contain Microchips",
        source: "Snopes",
        credibility: 95
      },
      {
        url: "https://factcheck.org/example", 
        title: "No Evidence of Microchips in Vaccines",
        source: "FactCheck.org",
        credibility: 93
      },
      {
        url: "https://reuters.com/example",
        title: "Fact Check: Microchip Claims Debunked",
        source: "Reuters",
        credibility: 91
      },
      {
        url: "https://apnews.com/example",
        title: "Health Officials Reject Microchip Claims",
        source: "AP News",
        credibility: 94
      }
    ],
    verdict: "false" as const,
    content: "COVID-19 vaccines contain microchips that allow government tracking of citizens"
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Origin Tracing Diagram Demo</h2>
        <p className="text-muted-foreground">
          Example of how misinformation flows from origin to current claim
        </p>
      </div>
      
      <OriginTracingDiagram
        originTracing={demoData.originTracing}
        beliefDrivers={demoData.beliefDrivers}
        sources={demoData.sources}
        verdict={demoData.verdict}
        content={demoData.content}
      />
    </div>
  );
}