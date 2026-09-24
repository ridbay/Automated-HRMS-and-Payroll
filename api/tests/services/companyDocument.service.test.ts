import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompanyDocumentService } from "../../src/services/companyDocument.service";

describe("CompanyDocumentService", () => {
  let mockDb: any;
  let service: CompanyDocumentService;
  const actor = { id: "emp-1", name: "Sarah Connor" };

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
      query: {
        companyDocuments: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
      },
    };
    service = new CompanyDocumentService({} as any);
    (service as any).db = mockDb;
  });

  describe("create", () => {
    it("rejects a document with no title, no content, and no file", async () => {
      await expect(
        service.create("comp-1", actor, { title: "", content: "" }),
      ).rejects.toThrow(
        "Title and either content or an attached file are required.",
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("rejects whitespace-only content with no file attached", async () => {
      await expect(
        service.create("comp-1", actor, { title: "Policy", content: "   " }),
      ).rejects.toThrow(
        "Title and either content or an attached file are required.",
      );
    });

    it("creates a text-only document, tagging the uploader", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
        title: "Remote Work Policy",
      });

      await service.create("comp-1", actor, {
        title: "Remote Work Policy",
        content: "Up to 3 days remote per week.",
      });

      expect(mockDb.insert).toHaveBeenCalled();
      const inserted = mockDb.values.mock.calls[0][0];
      expect(inserted.title).toBe("Remote Work Policy");
      expect(inserted.uploadedById).toBe("emp-1");
      expect(inserted.uploadedByName).toBe("Sarah Connor");
      expect(inserted.fileKey).toBeNull();
    });

    it("uploads an attached file to R2 and records its key/name", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
      });
      const bucket = { put: vi.fn().mockResolvedValue(undefined) };
      const file = new File(["policy text"], "handbook.pdf", {
        type: "application/pdf",
      });

      await service.create(
        "comp-1",
        actor,
        { title: "Handbook", content: "See attached.", file },
        bucket as any,
      );

      expect(bucket.put).toHaveBeenCalled();
      const inserted = mockDb.values.mock.calls[0][0];
      expect(inserted.fileName).toBe("handbook.pdf");
      expect(inserted.fileKey).toContain("companies/comp-1/documents/");
    });

    it("accepts a file with no manual content, storing a placeholder for the D1 preview", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
      });
      const bucket = { put: vi.fn().mockResolvedValue(undefined) };
      const file = new File(["policy text"], "handbook.pdf", {
        type: "application/pdf",
      });

      await service.create(
        "comp-1",
        actor,
        { title: "Handbook", content: "", file },
        bucket as any,
      );

      const inserted = mockDb.values.mock.calls[0][0];
      expect(inserted.content).toBe(
        "Content indexed automatically from the attached file.",
      );
    });

    it("stamps the R2 object with the document title as custom metadata (for AI Search)", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
      });
      const bucket = { put: vi.fn().mockResolvedValue(undefined) };
      const file = new File(["policy text"], "handbook.pdf", {
        type: "application/pdf",
      });

      await service.create(
        "comp-1",
        actor,
        { title: "Handbook", content: "", file },
        bucket as any,
      );

      const putOptions = bucket.put.mock.calls[0][2];
      expect(putOptions.customMetadata).toEqual({ title: "Handbook" });
    });
  });

  describe("delete", () => {
    it("throws when the document does not exist for this company", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce(undefined);
      await expect(service.delete("comp-1", "DOC-404")).rejects.toThrow(
        "Document not found",
      );
      expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it("deletes the R2 file (when present) and the row", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
        fileKey: "companies/comp-1/documents/DOC-1-handbook.pdf",
      });
      const bucket = { delete: vi.fn().mockResolvedValue(undefined) };

      await service.delete("comp-1", "DOC-1", bucket as any);

      expect(bucket.delete).toHaveBeenCalledWith(
        "companies/comp-1/documents/DOC-1-handbook.pdf",
      );
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it("deletes the row even when there is no attached file", async () => {
      mockDb.query.companyDocuments.findFirst.mockResolvedValueOnce({
        id: "DOC-1",
        fileKey: null,
      });
      await service.delete("comp-1", "DOC-1");
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("search", () => {
    const docs = [
      {
        id: "DOC-1",
        title: "Remote Work Policy",
        content:
          "Employees may work remotely up to three days a week with manager approval.",
      },
      {
        id: "DOC-2",
        title: "Expense Reimbursement",
        content:
          "Submit receipts within 30 days. Remote employees may claim internet costs.",
      },
      {
        id: "DOC-3",
        title: "Dress Code",
        content: "Business casual is expected in the office.",
      },
    ];

    it("returns nothing for an empty or whitespace-only query", async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce(docs);
      expect(await service.search("comp-1", "")).toEqual([]);
      expect(await service.search("comp-1", "   ")).toEqual([]);
    });

    it("ranks a title match above a body-only match", async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce(docs);

      const results = await service.search("comp-1", "remote");

      expect(results.map((r) => r.id)).toEqual(["DOC-1", "DOC-2"]); // DOC-1 has "Remote" in the title
      expect(results.find((r) => r.id === "DOC-3")).toBeUndefined(); // no match at all
    });

    it("excludes documents with zero matches entirely", async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce(docs);
      const results = await service.search("comp-1", "dress code");
      expect(results.map((r) => r.id)).toEqual(["DOC-3"]);
    });

    it("returns an excerpt centered on the match, not just the start of the document", async () => {
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce([
        {
          id: "DOC-1",
          title: "Long Policy",
          content:
            "A".repeat(500) +
            " parking allowance is two hundred naira " +
            "B".repeat(500),
        },
      ]);

      const results = await service.search("comp-1", "parking");

      expect(results[0].excerpt).toContain("parking allowance");
      expect(results[0].excerpt.length).toBeLessThan(500 + 500); // not the whole document
    });

    it("respects the limit and returns only the top N matches", async () => {
      const manyDocs = Array.from({ length: 10 }, (_, i) => ({
        id: `DOC-${i}`,
        title: `Policy ${i} remote`,
        content: "remote work",
      }));
      mockDb.query.companyDocuments.findMany.mockResolvedValueOnce(manyDocs);

      const results = await service.search("comp-1", "remote", 3);
      expect(results).toHaveLength(3);
    });
  });
});
