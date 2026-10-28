// Recognize requests for a visual independently of the topic being diagrammed.
const diagram = /\b(?:flow[\s-]?charts?|flow[\s-]?diagrams?|diagrams?|mermaid|process\s+maps?)\b/i;
const create = /\b(?:draw|create|make|generate|build|render|visuali[sz]e|sketch|design|show|give|provide|turn|convert|illustrate)\b/i;
export function isDiagramRequest(text: string): boolean {
  const question = text.trim().replace(/[’‘]/g, "'");
  // Explaining syntax or explicitly requesting code must not mutate a canvas.
  if (/\b(?:don't|do not|never)\s+(?:(?:ever|please)\s+)?(?:draw|create|make|generate|build|render|visuali[sz]e|sketch|design|show|give|provide|map\s+out)\b|\b(?:without|no)\s+(?:an?\s+)?(?:canvas|drawing|diagram|rendering)\b/i.test(question) ||
      /\b(?:only|just)\s+(?:the\s+)?(?:mermaid\s+)?(?:code|syntax|text)\b|\b(?:code|syntax|text)\s+only\b/i.test(question) ||
      /^(?:(?:please|can you|could you|would you)\s+)*(?:(?:what|why|when|where|which|how)\b|(?:tell|teach|show)\s+me\s+how\b|explain\s+how\b)/i.test(question)) return false;
  if (extractMermaid(question)) return true;
  if (/\b(?:visuali[sz]e|map\s+out)\b/i.test(question)) return true;
  if (!diagram.test(question)) return false;
  return create.test(question) || /\b(?:i\s+(?:want|need)|i'd\s+like|i\s+would\s+like)\b/i.test(question) ||
    /^(?:please\s+)?(?:an?\s+)?(?:flow[\s-]?charts?|flow[\s-]?diagrams?|diagrams?|mermaid|process\s+maps?)\b/i.test(question) ||
    /\b(?:with|using|as|in\s+the\s+form\s+of)\s+(?:an?\s+)?(?:flow[\s-]?charts?|flow[\s-]?diagrams?|diagrams?)\b/i.test(question);
}

export function extractMermaid(text: string): string | undefined {
  for (const block of text.matchAll(/```(?:mermaid)?\s*([\s\S]*?)```/gi)) {
    const source = block[1].trim();
    if (/^(?:graph|flowchart)\s+(?:TD|LR|TB|RL|BT)\b/.test(source)) return source;
  }
  const source = text.trim();
  return /^(?:graph|flowchart)\s+(?:TD|LR|TB|RL|BT)\b/.test(source) ? source : undefined;
}
