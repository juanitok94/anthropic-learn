import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = 'You are a precise technical educator. Produce clean structured markdown. No filler.';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 800;

function buildHarvestPrompt(payload: { label: string; sourceId: string; level: string; isBiz: boolean; mode: string }): string {
  const { label, level, isBiz, mode } = payload;

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
    return `You are a technical knowledge manager. Produce a KNOWLEDGE BASE ENTRY for "${label}" (Anthropic docs).
Include: **Summary** (2-3 sentences), **Key Facts** (bullet list), **Use Cases**, **Quick Reference** (code block with key syntax).
Be precise. Format in clean markdown.`;
  }

  return `You are a technical educator creating a ${level}-level course on using Claude/Anthropic APIs.
Produce a LESSON for "${label}" with:
1. **Why This Matters** - 1-2 sentences
2. **Core Concept** - clear explanation, 2-3 paragraphs
3. **Key Techniques** - bullet list of actionable tips
4. **Worked Example** - a concrete, minimal code or prompt example
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
      prompt = buildHarvestPrompt(payload);
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
