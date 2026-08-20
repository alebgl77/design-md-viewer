import { z } from 'zod';
import { DesignSystem } from '../schema/designSystem';

const AiEnrichmentResponseSchema = z.object({
  tagline: z.string().optional(),
  philosophy: z.string().optional(),
  visualTone: z.string().optional(),
  principles: z.array(z.string()).optional(),
  componentDescriptions: z.record(z.string()).optional(),
  componentVariantsInferred: z.record(z.array(z.string())).optional(),
});

export interface AiConfig {
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
}

export async function enrichWithAi(
  system: DesignSystem,
  config: AiConfig
): Promise<{ system: DesignSystem; success: boolean; message: string }> {
  if (!config.apiKey && !config.customEndpoint) {
    return {
      system,
      success: false,
      message: 'No API key configured. Running with 100% deterministic parsing.',
    };
  }

  try {
    const prompt = `You are a Senior Design System Architect.
Analyze the following design system document and enrich its high-level conceptual metadata.
DO NOT invent any fake hex codes or pixel measurements. Only infer semantic concepts, tone, design philosophy, and component descriptions.

DESIGN DOCUMENT CONTENT:
"""
${system.rawContent.slice(0, 8000)}
"""

EXISTING EXTRACTED COMPONENTS:
${system.components.map(c => c.name).join(', ')}

Return a single JSON object strictly matching this schema:
{
  "tagline": "Short 1-sentence tagline describing the visual identity",
  "philosophy": "1-2 sentence core design philosophy",
  "visualTone": "3-5 adjectives describing the visual tone (e.g. Modern, Minimal, High-Contrast)",
  "principles": ["Principle 1", "Principle 2", "Principle 3"],
  "componentDescriptions": {
    "ComponentName": "Concise usage guidance for this component"
  }
}
`;

    let rawJsonText = '';

    if (config.customEndpoint) {
      const res = await fetch(config.customEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      rawJsonText = data.text || JSON.stringify(data);
    } else {
      // Direct Gemini API call
      const model = config.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Service returned status ${res.status}`);
      }

      const data = await res.json();
      rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    }

    // Clean JSON markdown fences if any
    const cleanJson = rawJsonText
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsedData = JSON.parse(cleanJson);
    const validated = AiEnrichmentResponseSchema.safeParse(parsedData);

    if (!validated.success) {
      return {
        system,
        success: false,
        message: 'AI response did not match schema. Retaining deterministic output.',
      };
    }

    const ai = validated.data;
    const enrichedSystem: DesignSystem = {
      ...system,
      metadata: {
        ...system.metadata,
        isAiEnriched: true,
      },
      overview: {
        ...system.overview,
        description: ai.tagline || system.overview.description,
        philosophy: ai.philosophy || system.overview.philosophy,
        visualTone: ai.visualTone || system.overview.visualTone,
        principles: ai.principles && ai.principles.length > 0 ? ai.principles : system.overview.principles,
      },
      components: system.components.map(comp => {
        const aiDesc = ai.componentDescriptions?.[comp.name];
        if (aiDesc && comp.description?.startsWith('Component specification')) {
          return {
            ...comp,
            description: aiDesc,
            confidence: 'inferred',
          };
        }
        return comp;
      }),
    };

    return {
      system: enrichedSystem,
      success: true,
      message: 'AI enrichment completed successfully.',
    };
  } catch (error: any) {
    return {
      system,
      success: false,
      message: `Deterministic analysis completed. AI enrichment unavailable (${error?.message || 'error'}).`,
    };
  }
}
