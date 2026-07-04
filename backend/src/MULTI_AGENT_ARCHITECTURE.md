# Multi-Agent Architecture for ContentCombine

> Based on: https://habr.com/ru/companies/alpinadigital/articles/1054436/
> Principle: 70% workflow, 30% autonomous agents

## Current State

ContentCombine has a monolithic pipeline (7 steps in one class):
```
fetch → normalize → score → deduplicate → cluster → generate → export
```

## Proposed: 3 Specialized Agents

### Agent 1: Collector (Библиотекарь)
**Role:** Fetch and normalize content from all sources

```
Responsibilities:
- Habr HTML parsing
- Medium RSS fetch
- Twitter API v2
- Telegram Bot API
- Normalize to unified format

Tools:
- HTTP client
- HTML parser
- RSS parser
- API clients

Memory:
- Source configurations
- Last fetch timestamps
- Rate limits
```

**Output:** `NormalizedContent[]`

### Agent 2: Analyst (Исследователь)
**Role:** Score, deduplicate, and cluster content

```
Responsibilities:
- Score using task-prioritizer signals
- Deduplicate by content hash
- Cluster by topic/tags
- Detect trending topics

Tools:
- TaskScorer (scoring engine)
- Hash functions
- Clustering algorithm

Memory:
- Score thresholds
- Cluster history
- Trending patterns
```

**Output:** `ClusteredContent[]`

### Agent 3: Curator (Ревьюер)
**Role:** Generate outputs and export

```
Responsibilities:
- Generate digest (top 10)
- Generate alerts (critical items)
- Generate trending summary
- Format for Telegram
- Send messages

Tools:
- Telegram exporter
- Pexels fetcher (visuals)
- Message formatter

Memory:
- Template configurations
- Channel settings
- Send history
```

**Output:** Telegram messages

## Workflow vs Autonomous

### Workflow (70%) - Deterministic
```
1. Collector fetches (fixed schedule)
2. Analyst scores (deterministic rules)
3. Curator exports (templates)
```

### Autonomous (30%) - Flexible
```
- Analyst: cluster topic detection (LLM)
- Curator: summary generation (LLM)
- Collector: source discovery (search)
```

## Implementation Plan

### Phase 1: Separate Agents (Week 1)
```typescript
// collector.ts
export class CollectorAgent {
  async fetch(): Promise<NormalizedContent[]> {
    // Current normalize logic
  }
}

// analyst.ts  
export class AnalystAgent {
  async analyze(items: NormalizedContent[]): Promise<ClusteredContent[]> {
    // Current score + deduplicate + cluster logic
  }
}

// curator.ts
export class CuratorAgent {
  async curate(clusters: ClusteredContent[]): Promise<TelegramMessage[]> {
    // Current generate + export logic
  }
}
```

### Phase 2: Add Intelligence (Week 2)
```typescript
// analyst.ts - add LLM for topic detection
async detectTopics(items: NormalizedContent[]): Promise<string[]> {
  // Use LLM to identify emerging topics
  // This is the 30% autonomous part
}

// curator.ts - add LLM for summaries
async generateSummary(cluster: ClusteredContent): Promise<string> {
  // Use LLM to create engaging summaries
}
```

### Phase 3: Metrics & Optimization (Week 3)
```typescript
// metrics.ts
export class PipelineMetrics {
  trackFetchTime(source: string, ms: number): void;
  trackScoreDistribution(scores: number[]): void;
  trackClusterQuality(clusters: ClusteredContent[]): void;
  trackExportSuccess(rate: number): void;
}
```

## Migration Path

| Step | Current | New | Risk |
|------|---------|-----|------|
| 1 | Monolith | 3 files | Low |
| 2 | Direct calls | Message queue | Medium |
| 3 | No metrics | Full observability | Low |
| 4 | Manual config | Auto-discovery | High |

## Metrics to Track

| Metric | Target | How |
|--------|--------|-----|
| Fetch time | <5s | Per source |
| Score accuracy | >85% | vs manual |
| Cluster quality | >80% | Human review |
| Export success | >99% | Telegram API |
| Cost per run | <$0.10 | API calls |

## Anti-Patterns to Avoid

1. **One big agent** - Don't merge all logic into one class
2. **Full autonomy** - Keep workflow deterministic for core path
3. **No metrics** - Measure before optimizing
4. **Force adoption** - Let users opt-in first

## Success Criteria

- [ ] 3 separate, testable agents
- [ ] 70/30 workflow/autonomy split
- [ ] Metrics for all steps
- [ ] 2-week shadow mode before full launch
