import { describe, expect, it } from "vitest";
import { buildNoteDraft, buildProjectDraft } from "@/domains/content/forms";

function formData(fields: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return form;
}

describe("content forms", () => {
  it("builds a project draft from form data", () => {
    const draft = buildProjectDraft(formData({ title: "RISC-V CPU", slug: "riscv-cpu", summary: "A CPU.", category: "Hardware" }));
    expect(draft).toEqual({ title: "RISC-V CPU", slug: "riscv-cpu", summary: "A CPU.", category: "Hardware", published: false });
  });
  it("builds a note draft from form data", () => {
    const draft = buildNoteDraft(formData({ title: "Note", slug: "note", summary: "excerpt text", body: "# body" }));
    expect(draft).toEqual({ title: "Note", slug: "note", excerpt: "excerpt text", body: "# body", published: false });
  });
  it("defaults missing fields to empty strings", () => {
    const draft = buildProjectDraft(formData({}));
    expect(draft.title).toBe("");
    expect(draft.published).toBe(false);
  });
});
