/** A plain, print-friendly style sheet: the doc as it looks in the editor, minus the app around it. */
const PRINT_CSS = `
  @page { margin: 22mm 20mm; }
  body { font: 11pt/1.6 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #0a0a0a; }
  h1 { font-size: 22pt; line-height: 1.2; margin: 0 0 10pt; letter-spacing: -0.02em; }
  h2 { font-size: 15pt; margin: 18pt 0 6pt; }
  h3 { font-size: 12.5pt; margin: 14pt 0 4pt; }
  p { margin: 0 0 6pt; }
  ul, ol { padding-left: 18pt; margin: 0 0 6pt; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] ul[data-type="taskList"] { padding-left: 18pt; }
  ul[data-type="taskList"] > li { display: flex; gap: 8pt; align-items: flex-start; }
  ul[data-type="taskList"] > li > label { padding-top: 2pt; }
  ul[data-type="taskList"] > li > div { flex: 1; }
  li[data-checked="true"] > div p { text-decoration: line-through; color: #777; }
  li > p { margin: 0 0 3pt; }
  pre { background: #f4f4f4; padding: 8pt 10pt; border-radius: 6pt; white-space: pre-wrap; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.9em; }
  blockquote { border-left: 2pt solid #ddd; margin: 0 0 6pt; padding-left: 10pt; color: #555; }
  a { color: inherit; }
`;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);
}

/**
 * Makes a PDF without a PDF library: the doc's HTML goes into a hidden
 * iframe with print styles, and the browser's print dialog saves it as a
 * PDF. The text stays selectable and the file is small.
 */
export function printAsPdf(title: string, bodyHtml: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.append(frame);

  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PRINT_CSS}</style></head><body>${bodyHtml}</body></html>`);
  doc.close();

  const view = frame.contentWindow!;
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  view.addEventListener("afterprint", cleanup, { once: true });
  // Let the iframe lay out before printing, otherwise some browsers print a blank page.
  setTimeout(() => {
    view.focus();
    view.print();
  }, 50);
}
