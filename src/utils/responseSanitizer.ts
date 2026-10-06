/**
 * StudyBuddy AI - Response Sanitizer
 * Strips any leaked model reasoning, planning notes, prompt artifacts, or self-evaluations
 * to guarantee that only the clean, final educational response reaches the student.
 */

export function sanitizeSystemGuideResponse(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();

  // 1. Strip thought / thinking / reasoning XML-style or bracket-style blocks
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  text = text.replace(/\[thought\][\s\S]*?\[\/thought\]/gi, '');
  text = text.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
  text = text.replace(/\[reasoning\][\s\S]*?\[\/reasoning\]/gi, '');

  // 2. Unwrap accidental outer markdown code blocks if the entire response is enclosed in ```
  if (text.startsWith('```markdown') && text.endsWith('```')) {
    text = text.slice(11, -3).trim();
  } else if (text.startsWith('```') && text.endsWith('```') && !text.slice(3, -3).includes('```')) {
    text = text.slice(3, -3).trim();
  }

  // 3. Cut off at Core Content / Final Response marker if present
  // Matches "Core Content...", "**Core Content:**", "## Core Content", "Final Response:", etc.
  const coreMarkerRegex = /(?:^|\n)\s*["'`]?\s*(?:#{1,4}\s*|\*{1,2}\s*)?(?:Core Content|Final Response|Student Response|Actual Response|Educational Response|Final Output)(?:\*{1,2})?[:\s\.-]*(?:\*{1,2})*(?:[:\s\.-]|\.{2,})*["'`]?\s*\n?([\s\S]+)/i;
  const coreMatch = text.match(coreMarkerRegex);
  if (coreMatch && coreMatch[1] && coreMatch[1].trim().length > 10) {
    text = coreMatch[1].trim();
  }

  // 4. If preamble contains internal reasoning markers and [SYSTEM GUIDE] or ⚔️ is present, slice from it
  const guideIdx = text.search(/(?:\[SYSTEM GUIDE\]|\[SYSTEM\]|⚔️)/i);
  if (guideIdx > 0) {
    const preamble = text.slice(0, guideIdx);
    if (/(?:Persona|Step \d+|Current Status|Intent|Reasoning|Planning|Strategy|user is asking|Since this is|Does it meet)/i.test(preamble)) {
      text = text.slice(guideIdx).trim();
    }
  }

  // 5. Strip trailing self-evaluation checklists / quality audits (with or without quotes)
  text = text.replace(/(?:^|\n)\s*["'`]?\s*(?:#{1,4}\s*|\*{1,2}\s*)?(?:Self-Evaluation|Self Evaluation|Verification|Quality Check|Checklist|Self-Audit|Evaluation Checklist|Evaluation)(?:\*{1,2})?[\s\S]*$/i, '');
  text = text.replace(/(?:^|\n)\s*["'`]?\s*(?:Does it meet the persona|Is it accurate|Is the content accurate|Did I (?:address|keep|answer|cover|maintain|include|follow)|Was the persona maintained)[\s\S]*$/i, '');
  text = text.replace(/(?:^|\n)\s*["'`]?\s*(?:Closing\/Next Steps)(?:\*{1,2})?(?:[:\s\.-]|\.{2,})*["'`]?\s*(?:\n\s*["'`]?\s*(?:Did I|Does it|Is it)[\s\S]*|$)/i, '');

  // 6. Line-by-line filtering of reasoning/planning prefixes at the beginning of the text
  const lines = text.split('\n');
  const cleanLines: string[] = [];
  let inPreamble = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inPreamble) {
      if (!trimmed) continue;

      const isMetaStep =
        /^(?:#{1,4}\s*|\*{1,2}\s*)?["'`]?\s*Step\s*\d+[:\s\.-]+(?:Acknowledge|Establish the quest|Define the concept|Provide the definition|Greet|Analyze the|Plan the|[^\n]*\.\.\.?)/i.test(trimmed);

      const isInternalMarker =
        isMetaStep ||
        /^(?:#{1,4}\s*|\*{1,2}\s*)?["'`]?\s*(?:Persona|Tone|Current Status|Intent|User Question|Generation Plan|Response Strategy|Response Structure|Internal Reasoning|Chain of Thought|System Prompt|Developer Prompt|Hidden Instructions|Current Context|User Status|Provider|Model|HTTP Status|Diagnostic|Implementation|Evaluation|Analysis|Reasoning|Planning|Plan|Strategy|Internal Plan|Target Audience|Learning Objectives|Core Content)(?:\*{1,2})?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^(?:#{1,4}\s*|\*{1,2}\s*)?["'`]?\s*(?:Closing\/Next Steps)(?:\*{1,2})?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*The user is asking (?:for|about|to)?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*Since this is (?:the first step|a question|an inquiry|the user's request|an educational request)?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*I (?:should|will|need to|must) (?:answer|explain|provide|maintain|structure|address|use|follow)?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*(?:Prompt|System) Instructions(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*Model Selection(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*Internal Context(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*Student Context(?:[:\s\.-]|\.{2,})/i.test(trimmed);

      if (isInternalMarker) {
        continue;
      }

      inPreamble = false;
      cleanLines.push(line);
    } else {
      const isInternalMarker =
        /^(?:#{1,4}\s*|\*{1,2}\s*)?["'`]?\s*(?:Closing\/Next Steps)(?:\*{1,2})?(?:[:\s\.-]|\.{2,})/i.test(trimmed) ||
        /^["'`]?\s*(?:Does it meet the persona|Is it accurate|Is the content accurate|Did I (?:address|keep|answer|cover|maintain|include|follow)|Was the persona)/i.test(trimmed);
      if (!isInternalMarker) {
        cleanLines.push(line);
      }
    }
  }

  let result = cleanLines.join('\n').trim();

  // If result is empty, return trimmed raw text
  if (!result) {
    return rawText.trim();
  }

  // Ensure double newlines aren't excessive
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}
