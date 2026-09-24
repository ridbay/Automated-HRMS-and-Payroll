import { describe, it, expect, vi } from 'vitest';
import { AiSearchService } from '../../src/services/aiSearch.service';

describe('AiSearchService', () => {
  it('scopes the query to the calling company\'s document folder', async () => {
    const instance = { search: vi.fn().mockResolvedValue({ search_query: 'q', chunks: [] }) };
    const service = new AiSearchService(instance as any);

    await service.search('comp-1', 'remote work policy');

    expect(instance.search).toHaveBeenCalledWith({
      query: 'remote work policy',
      ai_search_options: {
        retrieval: {
          filters: { folder: 'companies/comp-1/documents/' },
          max_num_results: 5,
        },
      },
    });
  });

  it('respects a custom result limit', async () => {
    const instance = { search: vi.fn().mockResolvedValue({ search_query: 'q', chunks: [] }) };
    const service = new AiSearchService(instance as any);

    await service.search('comp-1', 'policy', 2);

    expect(instance.search).toHaveBeenCalledWith(
      expect.objectContaining({ ai_search_options: expect.objectContaining({ retrieval: expect.objectContaining({ max_num_results: 2 }) }) })
    );
  });

  it('maps chunks to { title, excerpt }, preferring the R2 custom-metadata title over the filename', async () => {
    const instance = {
      search: vi.fn().mockResolvedValue({
        search_query: 'q',
        chunks: [
          { id: 'c1', type: 'text', score: 0.9, text: 'Up to 3 days remote per week.', item: { key: 'companies/comp-1/documents/DOC-1-handbook.pdf', metadata: { title: 'Remote Work Policy' } } },
        ],
      }),
    };
    const service = new AiSearchService(instance as any);

    const results = await service.search('comp-1', 'remote work');

    expect(results).toEqual([{ title: 'Remote Work Policy', excerpt: 'Up to 3 days remote per week.' }]);
  });

  it('falls back to the R2 object filename when no title metadata is present', async () => {
    const instance = {
      search: vi.fn().mockResolvedValue({
        search_query: 'q',
        chunks: [{ id: 'c1', type: 'text', score: 0.8, text: 'Some excerpt.', item: { key: 'companies/comp-1/documents/DOC-2-handbook.pdf', metadata: {} } }],
      }),
    };
    const service = new AiSearchService(instance as any);

    const results = await service.search('comp-1', 'handbook');

    expect(results).toEqual([{ title: 'DOC-2-handbook.pdf', excerpt: 'Some excerpt.' }]);
  });

  it('returns an empty array when there are no matching chunks', async () => {
    const instance = { search: vi.fn().mockResolvedValue({ search_query: 'q', chunks: [] }) };
    const service = new AiSearchService(instance as any);

    expect(await service.search('comp-1', 'nonexistent')).toEqual([]);
  });
});
