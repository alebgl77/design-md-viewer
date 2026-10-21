export interface SourceInput {
  name: string;
  content: string;
}

export interface SourceSummary {
  name: string;
  format: string;
  warnings: string[];
}

export interface ImportResult {
  markdown: string;
  fileName: string;
  sources: SourceSummary[];
  warnings: string[];
}

/** Adapters return inert Markdown, never DOM, executable CSS or remote resources. */
export interface AdaptedSource {
  markdown: string;
  format: string;
  warnings: string[];
  /** An unchanged, single Markdown source can keep its original filename. */
  originalMarkdown?: boolean;
  preserveMarkdown?: boolean;
  definitions?: { name: string; value: string }[];
}
