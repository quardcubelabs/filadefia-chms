import { useState, useCallback } from 'react';

interface ReportDataForAI {
  reportType: string;
  totalMembers?: number;
  activeMembers?: number;
  newMembers?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  totalEvents?: number;
  upcomingEvents?: number;
  completedEvents?: number;
  totalDepartments?: number;
  totalZones?: number;
  attendanceRate?: number;
  periodStart?: string;
  periodEnd?: string;
  departmentStats?: Array<{
    name: string;
    memberCount: number;
    totalIncome?: number;
    totalExpenses?: number;
  }>;
  zoneStats?: Array<{
    name: string;
    memberCount: number;
    totalIncome?: number;
  }>;
  financialTrends?: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

interface UseAIInsightsResult {
  insights: string | null;
  loading: boolean;
  error: string | null;
  generateInsights: (reportData: ReportDataForAI) => Promise<string | null>;
  clearInsights: () => void;
}

export function useAIInsights(): UseAIInsightsResult {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (reportData: ReportDataForAI): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate insights');
      }

      const data = await response.json();
      
      if (data.success && data.insights) {
        setInsights(data.insights);
        return data.insights;
      } else {
        throw new Error('No insights generated');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate AI insights';
      setError(errorMessage);
      console.error('AI Insights Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearInsights = useCallback(() => {
    setInsights(null);
    setError(null);
  }, []);

  return {
    insights,
    loading,
    error,
    generateInsights,
    clearInsights
  };
}

// Utility function to format AI insights for display
export function formatAIInsights(insights: string): {
  executiveSummary: string;
  highlights: string[];
  areasForAttention: string[];
  recommendation: string;
} {
  const sections = {
    executiveSummary: '',
    highlights: [] as string[],
    areasForAttention: [] as string[],
    recommendation: ''
  };

  if (!insights) return sections;

  // Try to parse structured sections
  const lines = insights.split('\n').filter(line => line.trim());
  let currentSection = 'executiveSummary';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('executive summary') || lowerLine.includes('summary')) {
      currentSection = 'executiveSummary';
      continue;
    } else if (lowerLine.includes('key highlight') || lowerLine.includes('achievement')) {
      currentSection = 'highlights';
      continue;
    } else if (lowerLine.includes('area') && (lowerLine.includes('attention') || lowerLine.includes('improvement'))) {
      currentSection = 'areasForAttention';
      continue;
    } else if (lowerLine.includes('recommendation') || lowerLine.includes('outlook')) {
      currentSection = 'recommendation';
      continue;
    }

    // Add content to appropriate section
    const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (!cleanLine) continue;

    if (currentSection === 'executiveSummary') {
      sections.executiveSummary += (sections.executiveSummary ? ' ' : '') + cleanLine;
    } else if (currentSection === 'highlights') {
      if (line.match(/^[-*•]/) || line.match(/^\d+\./)) {
        sections.highlights.push(cleanLine);
      } else if (sections.highlights.length > 0) {
        sections.highlights[sections.highlights.length - 1] += ' ' + cleanLine;
      } else {
        sections.highlights.push(cleanLine);
      }
    } else if (currentSection === 'areasForAttention') {
      if (line.match(/^[-*•]/) || line.match(/^\d+\./)) {
        sections.areasForAttention.push(cleanLine);
      } else if (sections.areasForAttention.length > 0) {
        sections.areasForAttention[sections.areasForAttention.length - 1] += ' ' + cleanLine;
      } else {
        sections.areasForAttention.push(cleanLine);
      }
    } else if (currentSection === 'recommendation') {
      sections.recommendation += (sections.recommendation ? ' ' : '') + cleanLine;
    }
  }

  return sections;
}

export default useAIInsights;
