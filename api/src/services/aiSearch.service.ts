import type { AiSearchInstance } from '@cloudflare/workers-types';

// Thin wrapper around the Cloudflare AI Search (formerly AutoRAG) binding.
// One AI Search instance ("zenhr-company-docs") covers the whole zenhr-storage
// R2 bucket but is scoped at creation time (--include-items "companies/*/documents/**")
// to only the company-knowledge-base folder — it never sees candidate resumes
// or branding assets that live under other prefixes in the same bucket.
// Multi-tenancy at query time relies on AI Search's automatic `folder` R2
// metadata, filtered per company so one tenant can never surface another's
// documents.
export class AiSearchService {
  constructor(private instance: AiSearchInstance) {}

  async search(companyId: string, query: string, limit = 5): Promise<{ title: string; excerpt: string }[]> {
    const result = await this.instance.search({
      query,
      ai_search_options: {
        retrieval: {
          filters: { folder: `companies/${companyId}/documents/` },
          max_num_results: limit,
        },
      },
    });

    return (result.chunks || []).map((chunk) => {
      const metadataTitle = chunk.item?.metadata?.title;
      const fallbackTitle = chunk.item?.key?.split('/').pop() || 'Untitled document';
      return {
        title: typeof metadataTitle === 'string' && metadataTitle ? metadataTitle : fallbackTitle,
        excerpt: chunk.text,
      };
    });
  }
}
