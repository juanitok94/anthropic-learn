import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sourcesData from '@/data/sources.json';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = 'You are a precise technical educator. Produce clean structured markdown. No filler.';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 800;

// Flatten sources into a url map keyed by id
const sourceUrlMap: Record<string, string> = {};
Object.values(sourcesData.sections).forEach(items => {
  items.forEach(item => { sourceUrlMap[item.id] = item.url; });
});

async function fetchDocContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; anthropic-learn/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 6000 ? text.slice(0, 6000) + '...' : text;
  } catch {
    return null;
  }
}

function buildHarvestPrompt(
  payload: { label: string; sourceId: string; level: string; isBiz: boolean; mode: string },
  docContent: string | null,
): string {
  const { label, level, isBiz, mode } = payload;
  const context = docContent
    ? `\n\n<doc_content>\n${docContent}\n</doc_content>\n\nUsing the doc content above as your source of truth,`
    : '';

  if (isBiz) {
    return `You are a business consultant who specializes in AI automation agencies.
Produce a practical BUSINESS APPLICATION GUIDE for "${label}" using Claude/Anthropic APIs at a ${level} level.

Structure:
1. **The Opportunity** - what problem this solves for clients and why they pay for it
2. **What to Build** - a concrete deliverable or service you can sell
3. **How Claude Makes It Work** - which Claude capabilities power this
4. **Pricing & Positioning** - realistic price range and how to pitch it
5. **Example Client Script** - a short conversation showing how to sell this
6. **Quick-Start Prompt** - a ready-to-use Claude prompt template

Write for someone building an AI services business. Be direct, practical, and opinionated. Format in clean markdown.`;
  }

  if (mode === 'kb') {
    return `You are a technical knowledge manager.${context} produce a KNOWLEDGE BASE ENTRY for "${label}" (Anthropic docs).
Include: **Summary** (2-3 sentences), **Key Facts** (bullet list of specific parameters/limits/names from the current docs), **Use Cases**, **Quick Reference** (code block with current model names and key syntax).
Be precise. Use exact model names and version numbers from the source. Format in clean markdown.`;
  }

  return `You are a technical educator creating a ${level}-level course on using Claude/Anthropic APIs.${context} produce a LESSON for "${label}" with:
1. **Why This Matters** - 1-2 sentences
2. **Core Concept** - clear explanation, 2-3 paragraphs
3. **Key Techniques** - bullet list of actionable tips (use exact API names, model IDs, and parameters from the current docs)
4. **Worked Example** - a concrete, minimal code or prompt example using current model names
5. **Common Mistakes** - 2-3 pitfalls to avoid
6. **What to Learn Next** - 1-2 related topics
Format in clean markdown. Write for a ${level} audience.`;
}

function buildAnalyzePrompt(payload: { chunkId: string; title: string; rawContent: string }): string {
  return `Analyze this transcript section from an advanced Claude Code course.

Title: ${payload.title}
Content:
${payload.rawContent}

Produce structured analysis in this EXACT format:

## Study Notes
[3-5 key concepts explained clearly for a developer. Be specific.]

## Tips & Techniques
[Bullet list of actionable tips from this section. Quote specific commands/approaches.]

## Curriculum Mapping
[Which Anthropic doc topics does this cover? List as "topic-id: reason" pairs.]

## Doc References
[List specific Anthropic documentation pages this connects to.]`;
}

function buildGapsPrompt(payload: { understood: string[]; allTopics: string[] }): string {
  return `Given these understood topics: ${payload.understood.join(', ')}
And all available topics: ${payload.allTopics.join(', ')}

Identify the 3 most important gaps to fill next. Format as:
1. **Topic** - why this matters given what they know
2. **Topic** - why this matters
3. **Topic** - why this matters`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, payload } = body;

    let prompt: string;
    if (type === 'harvest') {
      // Fetch live doc content unless this is a biz topic (no dedicated doc URL)
      let docContent: string | null = null;
      if (!payload.isBiz) {
        const url = sourceUrlMap[payload.sourceId];
        if (url) docContent = await fetchDocContent(url);
      }
      prompt = buildHarvestPrompt(payload, docContent);
    } else if (type === 'analyze') {
      prompt = buildAnalyzePrompt(payload);
    } else if (type === 'gaps') {
      prompt = buildGapsPrompt(payload);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content.find(c => c.type === 'text')?.text ?? '';
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
