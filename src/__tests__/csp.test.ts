import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The Content Security Policy allows exactly one inline script: the theme bootstrap, pinned by
 * hash. Nothing enforces that the hash still describes the script, so editing the bootstrap
 * would silently break it — the browser would refuse to run it and the page would flash the
 * wrong theme on every load, with no error anyone would notice in review.
 *
 * These tests make that failure loud.
 */

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');

function inlineScripts(source: string): string[] {
  return [...source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
}

function cspContent(source: string): string {
  const match = source.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([\s\S]*?)"\s*\/?>/i);
  return match ? match[1] : '';
}

describe('Content Security Policy', () => {
  it('declares a policy in the document, since GitHub Pages sends no headers we control', () => {
    expect(cspContent(html)).not.toBe('');
  });

  it('pins the hash of every inline script it ships', () => {
    const scripts = inlineScripts(html);
    const policy = cspContent(html);

    // One bootstrap, no more. A second inline script would need its own hash.
    expect(scripts).toHaveLength(1);

    const digest = createHash('sha256').update(scripts[0], 'utf8').digest('base64');
    expect(policy).toContain(`'sha256-${digest}'`);
  });

  it('never falls back to unsafe-inline for scripts', () => {
    const policy = cspContent(html);
    const scriptSrc = policy.split(';').find(d => d.trim().startsWith('script-src')) ?? '';

    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('keeps the directives that carry the weight of this threat model', () => {
    const policy = cspContent(html).replace(/\s+/g, ' ');

    // A parsed document must not be able to reach an arbitrary origin.
    expect(policy).toContain("connect-src 'self' https://generativelanguage.googleapis.com");
    // Plugin and base-tag injection, and any form post, are closed off outright.
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'none'");
  });

  it('does not send the API key anywhere a URL would record it', () => {
    const service = readFileSync(resolve(__dirname, '../ai/aiEnrichmentService.ts'), 'utf8');

    // A key in a query string lands in history and in every log along the way.
    expect(service).not.toMatch(/[?&]key=\$\{/);
    expect(service).toContain('x-goog-api-key');
  });
});
