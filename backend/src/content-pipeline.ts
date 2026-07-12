/**
 * ContentCombine Pipeline for ai-scout
 * 
 * 7-step process:
 * 1. Fetch content from multiple sources (Habr, Medium, Twitter, Telegram)
 * 2. Normalize to unified format
 * 3. Score using task-prioritizer
 * 4. Deduplicate by content hash
 * 5. Cluster by topic/tags
 * 6. Generate three outputs (digest, alerts, trending)
 * 7. Export to Telegram
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

interface NormalizedContent {
  id: string;
  source: string;
  source_id: string;
  title: string;
  content: string;
  url: string;
  author: string;
  author_id?: string;
  published_at: string;
  fetched_at: string;
  content_type: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface ScoredContent extends NormalizedContent {
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  signals: {
    trigger_score: number;
    entity_score: number;
    combo_score: number;
    freshness_multiplier: number;
  };
}

interface ClusteredContent {
  cluster_id: string;
  topic: string;
  items: ScoredContent[];
  avg_score: number;
  tags: string[];
}

interface PipelineConfig {
  habr?: { enabled: boolean };
  medium?: { enabled: boolean; usernames?: string[] };
  twitter?: { enabled: boolean; bearer_token?: string; query?: string };
  telegram?: { enabled: boolean; bot_token?: string; channel_id?: string };
  
  // Output
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  
  // Processing
  min_score?: number;
  max_items?: number;
  dedup_threshold?: number;
}

export class ContentPipeline {
  private config: PipelineConfig;
  private httpClient: AxiosInstance;
  private normalizerUrl: string;
  private prioritizerUrl: string;

  constructor(
    config: PipelineConfig,
    normalizerUrl: string = 'http://localhost:8000',
    prioritizerUrl: string = 'http://localhost:8001'
  ) {
    this.config = config;
    this.normalizerUrl = normalizerUrl;
    this.prioritizerUrl = prioritizerUrl;
    this.httpClient = axios.create({ timeout: 30000 });
  }

  /**
   * STEP 1: Fetch content from all sources
   */
  async fetchAllSources(): Promise<NormalizedContent[]> {
    console.log('[pipeline] STEP 1: Fetching from all sources...');
    
    const allContent: NormalizedContent[] = [];

    try {
      // Call normalizer microservice
      const response = await this.httpClient.post(
        `${this.normalizerUrl}/normalize`,
        { config: this.config }
      );
      
      allContent.push(...response.data.content);
      console.log(`[pipeline] Fetched ${allContent.length} items`);
    } catch (error) {
      console.error('[pipeline] Error fetching sources:', error);
    }

    return allContent;
  }

  /**
   * STEP 2: Already normalized by normalizer service
   */
  async normalizeContent(content: NormalizedContent[]): Promise<NormalizedContent[]> {
    console.log('[pipeline] STEP 2: Content already normalized');
    return content;
  }

  /**
   * STEP 3: Score using task-prioritizer
   */
  async scoreContent(content: NormalizedContent[]): Promise<ScoredContent[]> {
    console.log('[pipeline] STEP 3: Scoring content...');
    
    const scored: ScoredContent[] = [];

    try {
      for (const item of content) {
        const response = await this.httpClient.post(
          `${this.prioritizerUrl}/score`,
          {
            title: item.title,
            content: item.content,
            tags: item.tags,
            source: item.source,
          }
        );

        const scoreData = response.data;
        
        const scoredItem: ScoredContent = {
          ...item,
          score: scoreData.score,
          priority: scoreData.priority,
          signals: scoreData.signals,
        };

        scored.push(scoredItem);
      }

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);
      
      console.log(`[pipeline] Scored ${scored.length} items`);
    } catch (error) {
      console.error('[pipeline] Error scoring content:', error);
      // Fallback: return with default score
      return content.map(item => ({
        ...item,
        score: 50,
        priority: 'medium',
        signals: {
          trigger_score: 0,
          entity_score: 0,
          combo_score: 0,
          freshness_multiplier: 1,
        },
      }));
    }

    return scored;
  }

  /**
   * STEP 4: Deduplicate by content hash
   */
  deduplicateContent(content: ScoredContent[], threshold: number = 0.85): ScoredContent[] {
    console.log('[pipeline] STEP 4: Deduplicating...');

    const seen = new Map<string, ScoredContent>();
    const deduplicated: ScoredContent[] = [];

    for (const item of content) {
      const hash = this.contentHash(item.title + item.content);
      
      if (!seen.has(hash)) {
        seen.set(hash, item);
        deduplicated.push(item);
      }
    }

    console.log(`[pipeline] Deduplicated: ${content.length} → ${deduplicated.length}`);
    return deduplicated;
  }

  /**
   * STEP 5: Cluster by topic/tags
   */
  clusterContent(content: ScoredContent[]): ClusteredContent[] {
    console.log('[pipeline] STEP 5: Clustering...');

    const clusters = new Map<string, ScoredContent[]>();

    // Cluster by primary tag or source
    for (const item of content) {
      const primaryTag = item.tags[0] || item.source;
      const clusterId = `${item.source}:${primaryTag}`;

      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, []);
      }
      clusters.get(clusterId)!.push(item);
    }

    // Convert to ClusteredContent
    const clusteredContent: ClusteredContent[] = Array.from(clusters.entries()).map(
      ([clusterId, items]) => {
        const avgScore = items.reduce((sum, item) => sum + item.score, 0) / items.length;
        const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

        return {
          cluster_id: clusterId,
          topic: clusterId,
          items: items.sort((a, b) => b.score - a.score),
          avg_score: avgScore,
          tags: allTags,
        };
      }
    );

    console.log(`[pipeline] Created ${clusteredContent.length} clusters`);
    return clusteredContent;
  }

  /**
   * STEP 6: Generate three outputs
   */
  generateOutputs(
    clusters: ClusteredContent[],
    minScore: number = 50
  ): {
    digest: ScoredContent[];
    alerts: ScoredContent[];
    trending: ClusteredContent[];
  } {
    console.log('[pipeline] STEP 6: Generating outputs...');

    const allItems = clusters.flatMap(c => c.items);

    // Digest: all items above min score
    const digest = allItems.filter(item => item.score >= minScore);

    // Alerts: high priority items
    const alerts = allItems.filter(item => 
      item.priority === 'critical' || item.priority === 'high'
    );

    // Trending: clusters with high average score
    const trending = clusters.filter(c => c.avg_score >= minScore);

    console.log(`[pipeline] Generated: ${digest.length} digest, ${alerts.length} alerts, ${trending.length} trending`);

    return { digest, alerts, trending };
  }

  /**
   * STEP 7: Export to Telegram
   */
  async exportToTelegram(
    outputs: {
      digest: ScoredContent[];
      alerts: ScoredContent[];
      trending: ClusteredContent[];
    }
  ): Promise<void> {
    console.log('[pipeline] STEP 7: Exporting to Telegram...');

    if (!this.config.telegram_bot_token || !this.config.telegram_chat_id) {
      console.warn('[pipeline] Telegram config not provided');
      return;
    }

    const botToken = this.config.telegram_bot_token;
    const chatId = this.config.telegram_chat_id;
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      // Send alerts first
      if (outputs.alerts.length > 0) {
        const alertMessage = this.formatAlertsMessage(outputs.alerts);
        await this.httpClient.post(telegramUrl, {
          chat_id: chatId,
          text: alertMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        });
        console.log('[pipeline] Sent alerts to Telegram');
      }

      // Send digest
      if (outputs.digest.length > 0) {
        const digestMessage = this.formatDigestMessage(outputs.digest);
        await this.httpClient.post(telegramUrl, {
          chat_id: chatId,
          text: digestMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        });
        console.log('[pipeline] Sent digest to Telegram');
      }

      // Send trending
      if (outputs.trending.length > 0) {
        const trendingMessage = this.formatTrendingMessage(outputs.trending);
        await this.httpClient.post(telegramUrl, {
          chat_id: chatId,
          text: trendingMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        });
        console.log('[pipeline] Sent trending to Telegram');
      }
    } catch (error) {
      console.error('[pipeline] Error exporting to Telegram:', error);
    }
  }

  /**
   * Full pipeline execution
   */
  async run(): Promise<void> {
    console.log('[pipeline] Starting ContentCombine pipeline...\n');

    try {
      // Step 1: Fetch
      const rawContent = await this.fetchAllSources();
      if (rawContent.length === 0) {
        console.log('[pipeline] No content fetched');
        return;
      }

      // Step 2: Normalize (already done by normalizer service)
      const normalized = await this.normalizeContent(rawContent);

      // Step 3: Score
      const scored = await this.scoreContent(normalized);

      // Step 4: Deduplicate
      const deduplicated = this.deduplicateContent(
        scored,
        this.config.dedup_threshold || 0.85
      );

      // Step 5: Cluster
      const clusters = this.clusterContent(deduplicated);

      // Step 6: Generate outputs
      const outputs = this.generateOutputs(
        clusters,
        this.config.min_score || 50
      );

      // Step 7: Export
      await this.exportToTelegram(outputs);

      console.log('[pipeline] Pipeline completed successfully\n');
    } catch (error) {
      console.error('[pipeline] Pipeline error:', error);
    }
  }

  // ==================== HELPERS ====================

  private contentHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  private formatAlertsMessage(alerts: ScoredContent[]): string {
    const top5 = alerts.slice(0, 5);
    let message = '🚨 <b>ALERTS</b>\n\n';

    for (const item of top5) {
      message += `<b>${item.title}</b>\n`;
      message += `Source: ${item.source} | Score: ${item.score}\n`;
      message += `<a href="${item.url}">Read more</a>\n\n`;
    }

    return message;
  }

  private formatDigestMessage(digest: ScoredContent[]): string {
    const top10 = digest.slice(0, 10);
    let message = '📰 <b>DIGEST</b>\n\n';

    for (const item of top10) {
      message += `<b>${item.title}</b>\n`;
      message += `${item.author} | ${item.source}\n`;
      message += `<a href="${item.url}">Read</a>\n\n`;
    }

    return message;
  }

  private formatTrendingMessage(trending: ClusteredContent[]): string {
    const top5 = trending.slice(0, 5);
    let message = '🔥 <b>TRENDING</b>\n\n';

    for (const cluster of top5) {
      message += `<b>${cluster.topic}</b> (${cluster.items.length} items, avg score: ${cluster.avg_score.toFixed(0)})\n`;
      message += `Tags: ${cluster.tags.join(', ')}\n\n`;
    }

    return message;
  }
}

// ==================== MAIN ====================

async function main() {
  const config: PipelineConfig = {
    habr: { enabled: true },
    medium: { enabled: false, usernames: [] },
    twitter: { enabled: false, bearer_token: '', query: 'AI' },
    telegram: { enabled: false, bot_token: '', channel_id: '' },
    
    // Output
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID,
    
    // Processing
    min_score: 50,
    max_items: 100,
    dedup_threshold: 0.85,
  };

  const pipeline = new ContentPipeline(config);
  await pipeline.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export default ContentPipeline;
