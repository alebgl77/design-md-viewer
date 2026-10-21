/** Escape generated prose even when a consumer later renders it as Markdown. */
export function prose(value: string): string {
  return value
    .replace(/[\r\n\t]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[`\\*_[\]{}()|#!]/g, character => `&#${character.charCodeAt(0)};`)
    .slice(0, 1_000);
}

export function inertText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```/g, '&#96;&#96;&#96;')
    .replace(/~~~/g, '&#126;&#126;&#126;');
}

/** Close only an actually open CommonMark-style fence at a merged-source boundary. */
export function balanceMarkdownFence(value: string): string {
  let open: { marker: string; length: number } | undefined;
  for (const line of value.split(/\r?\n/)) {
    const match = line.trim().match(/^(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    if (open) {
      if (match[1][0] === open.marker && match[1].length >= open.length && !match[2].trim()) open = undefined;
    } else {
      open = { marker: match[1][0], length: match[1].length };
    }
  }
  return open ? `${value}\n${open.marker.repeat(open.length)}` : value;
}

export function cssFence(declarations: { name: string; value: string }[]): string {
  if (!declarations.length) return '';
  return ['```css', ':root {', ...declarations.map(d => `  ${d.name}: ${d.value};`), '}', '```'].join('\n');
}

export function table(heading: string, headers: string[], rows: string[][]): string {
  if (!rows.length) return '';
  return [
    `### ${heading}`,
    '',
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(
      row =>
        `| ${row.map(value => prose(value).replace(/&#35;/g, '#').replace(/&#40;/g, '(').replace(/&#41;/g, ')')).join(' | ')} |`
    ),
    '',
  ].join('\n');
}
