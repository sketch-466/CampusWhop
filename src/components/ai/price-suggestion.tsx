"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PriceSuggestionProps {
  title: string;
  category: string;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  onSuggestionSelect?: (price: number) => void;
}

interface PriceAnalysis {
  suggestedPrice: number;
  marketRange: { low: number; high: number };
  confidence: "high" | "medium" | "low";
  trend: "rising" | "falling" | "stable";
  demandScore: number;
  factors: string[];
}

export function PriceSuggestion({
  title,
  category,
  condition,
  onSuggestionSelect,
}: PriceSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);

  useEffect(() => {
    if (!title || title.length < 3) return;

    const timeout = setTimeout(() => {
      analyzePrice();
    }, 800);

    return () => clearTimeout(timeout);
  }, [title, category, condition]);

  const analyzePrice = async () => {
    setLoading(true);

    // Simulate AI analysis - in production, this would call your Campus AI API
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock intelligent pricing based on inputs
    const basePrices: Record<string, number> = {
      textbook: 3500,
      laptop: 150000,
      phone: 45000,
      calculator: 8000,
      "course notes": 1500,
      furniture: 25000,
      clothing: 5000,
      electronics: 30000,
      other: 10000,
    };

    const conditionMultipliers: Record<string, number> = {
      new: 1.0,
      like_new: 0.85,
      good: 0.7,
      fair: 0.5,
      poor: 0.3,
    };

    const base = basePrices[category.toLowerCase()] || 10000;
    const multiplier = conditionMultipliers[condition] || 0.7;
    const suggested = Math.round(base * multiplier);

    // Add some "intelligence" variation
    const variance = 0.15;
    const low = Math.round(suggested * (1 - variance));
    const high = Math.round(suggested * (1 + variance));

    const mockAnalysis: PriceAnalysis = {
      suggestedPrice: suggested,
      marketRange: { low, high },
      confidence: Math.random() > 0.3 ? "high" : "medium",
      trend: Math.random() > 0.5 ? "rising" : "stable",
      demandScore: Math.floor(Math.random() * 40) + 60,
      factors: [
        `${condition} condition affects resale by ${Math.round((1 - multiplier) * 100)}%`,
        "High demand during exam season",
        "3 similar items sold this week",
        "Course-linked items get 23% more views",
      ],
    };

    setAnalysis(mockAnalysis);
    setLoading(false);
  };

  if (!title || title.length < 3) return null;

  return (
    <Card className="border-emerald-500/20 bg-emerald-950/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

      <CardHeader className="pb-3 relative">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          Campus AI Price Intelligence
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Analyzing campus market data...
            </span>
          </div>
        ) : analysis ? (
          <>
            {/* Main Suggestion */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suggested Price</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ₦{analysis.suggestedPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  {analysis.trend === "rising" && (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {analysis.trend === "falling" && (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  {analysis.trend === "stable" && (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      analysis.trend === "rising"
                        ? "text-emerald-400"
                        : analysis.trend === "falling"
                        ? "text-rose-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {analysis.trend}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border",
                    analysis.confidence === "high"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}
                >
                  {analysis.confidence} confidence
                </span>
              </div>
            </div>

            {/* Market Range */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Market range</span>
                <span>Demand score: {analysis.demandScore}/100</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1/4 bg-rose-400/30 rounded-l-full" />
                <div className="absolute left-1/4 top-0 h-full w-2/4 bg-emerald-400/50" />
                <div className="absolute right-0 top-0 h-full w-1/4 bg-rose-400/30 rounded-r-full" />
                <div
                  className="absolute top-0 h-full w-0.5 bg-white"
                  style={{
                    left: `${((analysis.suggestedPrice - analysis.marketRange.low) /
                      (analysis.marketRange.high - analysis.marketRange.low)) *
                      100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-rose-400">₦{analysis.marketRange.low.toLocaleString()}</span>
                <span className="text-emerald-400">₦{analysis.marketRange.high.toLocaleString()}</span>
              </div>
            </div>

            {/* Factors */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">Why this price?</p>
              {analysis.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  {factor}
                </div>
              ))}
            </div>

            {/* Action */}
            {onSuggestionSelect && (
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500"
                onClick={() => onSuggestionSelect(analysis.suggestedPrice)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use Suggested Price
              </Button>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
