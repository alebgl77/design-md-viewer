import { afterEach, describe, expect, it, vi } from 'vitest';
import { enrichWithAi } from '../aiEnrichmentService';
import { parseDesignDocument } from '../../parsers/pipeline';

afterEach(() => vi.unstubAllGlobals());

function mockResponse(body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => body }));
}

function designSystem() {
  const system = parseDesignDocument('# Example\n\n## Colors\n\nPrimary: #123456', 'example.md');
  system.components = [
    {
      id: 'button',
      name: 'Button',
      description: 'Component specification for Button',
      provenance: { headingPath: ['Components'], rawSourceSnippet: 'Button' },
      confidence: 'explicit',
    },
  ];
  return system;
}

describe('AI enrichment validation', () => {
  it('accepts arbitrary component keys and string-array records without changing extracted tokens', async () => {
    mockResponse({
      tagline: 'Validated description',
      componentDescriptions: { Button: 'Use for the primary action', 'unlisted component': 'Other' },
      componentVariantsInferred: { Button: ['primary', 'secondary'] },
    });
    const system = designSystem();
    const result = await enrichWithAi(system, { customEndpoint: 'https://example.test/enrich' });

    expect(result.success).toBe(true);
    expect(result.system.overview.description).toBe('Validated description');
    expect(result.system.components[0]).toMatchObject({
      description: 'Use for the primary action',
      confidence: 'inferred',
    });
    expect(result.system.colors).toEqual(system.colors);
    expect(system.components[0].description).toBe('Component specification for Button');
  });

  it('keeps optional enrichment fields absent', async () => {
    mockResponse({});
    const system = designSystem();
    const result = await enrichWithAi(system, { customEndpoint: 'https://example.test/enrich' });

    expect(result.success).toBe(true);
    expect(result.system.overview).toEqual(system.overview);
    expect(result.system.components).toEqual(system.components);
  });

  it.each([
    { componentDescriptions: { Button: 42 } },
    { componentDescriptions: { Button: null } },
    { componentVariantsInferred: { Button: 'primary' } },
    { componentVariantsInferred: { Button: ['primary', 42] } },
  ])('retains deterministic output when a record value is malformed: %j', async body => {
    mockResponse(body);
    const system = designSystem();
    const result = await enrichWithAi(system, { customEndpoint: 'https://example.test/enrich' });

    expect(result).toEqual({
      system,
      success: false,
      message: 'AI response did not match schema. Retaining deterministic output.',
    });
  });
});
