/**
 * VotingStats - Displays statistics about community voting
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Award, Activity } from "lucide-react";

/**
 * VotingStats component displays voting statistics
 */
export const VotingStats = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Active Voters
              </span>
            </div>
            <span className="text-lg font-bold">1,247</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total Votes
              </span>
            </div>
            <span className="text-lg font-bold">8,923</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Articles Verified
              </span>
            </div>
            <span className="text-lg font-bold">342</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Voting Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Help verify news credibility by voting on articles. Your votes
            contribute to our community-driven fact-checking system.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <div>
                <p className="font-medium text-foreground">Credible</p>
                <p className="text-xs">
                  Article appears accurate and trustworthy
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-500 font-bold">?</span>
              <div>
                <p className="font-medium text-foreground">Unsure</p>
                <p className="text-xs">
                  Need more information to determine credibility
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <div>
                <p className="font-medium text-foreground">Not Credible</p>
                <p className="text-xs">
                  Article appears misleading or false
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-center">
            <span className="font-semibold text-primary">
              Your vote matters!
            </span>
            <br />
            <span className="text-muted-foreground">
              Join the community in fighting misinformation
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
