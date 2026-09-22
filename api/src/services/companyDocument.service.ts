import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { StorageService } from './storage.service';

const genId = () => `DOC-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

export interface DocumentActor {
  id: string;
  name: string;
}

// Company-wide knowledge base the AI assistant searches (searchCompanyDocuments
// tool in ai.service.ts). There is no PDF/DOCX text-extraction pipeline in
// this Worker, so `content` is plain text supplied directly by the admin —
// an optional attached file is stored in R2 purely for reference/download
// and is never itself parsed or searched.
export class CompanyDocumentService {
  private db;

  constructor(dbBinding: D1Database) {
    this.db = drizzle(dbBinding, { schema });
  }

  async create(
    companyId: string,
    actor: DocumentActor,
    data: { title: string; content: string; file?: File | null },
    bucket?: R2Bucket
  ) {
    const title = data.title?.trim();
    const content = data.content?.trim();
    if (!title || !content) {
      throw new Error('Title and content are required.');
    }

    const id = genId();
    let fileKey: string | null = null;
    let fileName: string | null = null;

    if (data.file) {
      const storage = new StorageService(bucket);
      fileKey = await storage.uploadFile(`companies/${companyId}/documents`, data.file, `${id}-${data.file.name}`);
      fileName = data.file.name;
    }

    await this.db.insert(schema.companyDocuments).values({
      id,
      companyId,
      title,
      content,
      fileKey,
      fileName,
      uploadedById: actor.id,
      uploadedByName: actor.name,
    });

    return this.db.query.companyDocuments.findFirst({ where: eq(schema.companyDocuments.id, id) });
  }

  async list(companyId: string) {
    return this.db.query.companyDocuments.findMany({
      where: eq(schema.companyDocuments.companyId, companyId),
      orderBy: [desc(schema.companyDocuments.createdAt)],
    });
  }

  async get(companyId: string, id: string) {
    return this.db.query.companyDocuments.findFirst({
      where: and(eq(schema.companyDocuments.id, id), eq(schema.companyDocuments.companyId, companyId)),
    });
  }

  async delete(companyId: string, id: string, bucket?: R2Bucket) {
    const doc = await this.get(companyId, id);
    if (!doc) throw new Error('Document not found');

    if (doc.fileKey) {
      await new StorageService(bucket).deleteFile(doc.fileKey);
    }

    await this.db.delete(schema.companyDocuments).where(eq(schema.companyDocuments.id, id));
    return { success: true };
  }

  // Simple keyword-relevance search (title matches weighted 3x over body
  // matches) — no embeddings/vector index, which is a deliberate scope
  // decision: it doesn't need any extra infra and is good enough for a
  // company-sized document set, rather than being a placeholder for a
  // "real" search that was never built.
  async search(companyId: string, query: string, limit = 5): Promise<{ id: string; title: string; excerpt: string }[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);
    if (!terms.length) return [];

    const docs = await this.list(companyId);

    const scored = (docs as any[])
      .map((doc) => {
        const titleLower = doc.title.toLowerCase();
        const contentLower = doc.content.toLowerCase();
        let score = 0;
        for (const term of terms) {
          score += countOccurrences(titleLower, term) * 3;
          score += countOccurrences(contentLower, term);
        }
        return { doc, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ doc }) => ({
      id: doc.id,
      title: doc.title,
      excerpt: buildExcerpt(doc.content, terms),
    }));
  }
}

const countOccurrences = (haystack: string, needle: string): number => {
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
};

const EXCERPT_RADIUS = 150;

const buildExcerpt = (content: string, terms: string[]): string => {
  const lowerContent = content.toLowerCase();
  const matchIndexes = terms.map((t) => lowerContent.indexOf(t)).filter((i) => i >= 0);
  const anchor = matchIndexes.length ? Math.min(...matchIndexes) : 0;

  const start = Math.max(0, anchor - EXCERPT_RADIUS);
  const end = Math.min(content.length, anchor + EXCERPT_RADIUS);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < content.length ? '…' : '';
  return prefix + content.slice(start, end).trim() + suffix;
};
