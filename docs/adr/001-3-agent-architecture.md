# ADR-001: 3-Agent Architecture for ContentCombine

> Date: 2026-07-02
> Status: Accepted
> Source: https://habr.com/ru/companies/alpinadigital/articles/1054436/

## Context

ContentCombine was a monolithic pipeline:
```
fetch → normalize → score → deduplicate → cluster → generate → export
```

Problems:
- Hard to test individual components
- Difficult to scale
- No clear separation of concerns

## Decision

Split into 3 specialized agents:

1. **Collector** (Workflow - 70%)
   - Habr HTML parsing
   - Medium RSS fetch
   - Twitter API v2
   - Telegram Bot API
   - Normalize to unified format

2. **Analyst** (Workflow - 70%)
   - Score using task-prioritizer signals
   - Deduplicate by content hash
   - Cluster by topic/tags
   - Detect trending topics

3. **Curator** (Autonomous - 30%)
   - Generate digest (top 10)
   - Generate alerts (critical items)
   - Generate trending summary
   - Format for Telegram
   - Send messages

## Consequences

### Positive
- Clear separation of concerns
- Easier to test (per-component)
- Better observability (per-component metrics)
- Scalable (can run collectors in parallel)

### Negative
- Initial refactoring (~2 days)
- Need to maintain 3 components
- Message passing overhead

### Risks
- Collector rate limits (API quotas)
- Analyst scoring accuracy
- Curator formatting errors

## Alternatives Considered

1. **Keep monolith** — rejected (testing, scalability)
2. **2 agents (Collector + Analyst)** — rejected (Curator too complex)
3. **Full microservices** — rejected (overkill for current scale)

## References

- Article: https://habr.com/ru/companies/alpinadigital/articles/1054436/
- ContentCombine: https://github.com/staurus86/contentcombine-demo
