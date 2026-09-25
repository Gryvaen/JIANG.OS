export function buildQuickLinkDraft(form: FormData) {
  return {
    label: String(form.get("label") ?? ""),
    url: String(form.get("url") ?? ""),
    icon: String(form.get("icon") ?? "link"),
    groupLabel: String(form.get("groupLabel") ?? "General"),
    keywords: String(form.get("keywords") ?? "").split(",").map(s => s.trim()).filter(Boolean),
    enabled: true
  };
}
