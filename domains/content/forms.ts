export function buildProjectDraft(form: FormData) {
  return { title: String(form.get("title") ?? ""), slug: String(form.get("slug") ?? ""), summary: String(form.get("summary") ?? ""), category: String(form.get("category") ?? ""), published: false };
}
export function buildNoteDraft(form: FormData) {
  return { title: String(form.get("title") ?? ""), slug: String(form.get("slug") ?? ""), excerpt: String(form.get("summary") ?? ""), body: String(form.get("body") ?? ""), published: false };
}
