export type SvargaMode = "balanced" | "research" | "reasoning" | "creative";

export type SourceKind = "vedic" | "modern" | "primary" | "web";

export interface SvargaSource {
  id: string;
  title: string;
  kind: SourceKind;
  authority: "primary" | "secondary" | "tertiary";
  locator?: string;
  excerpt?: string;
  score?: number;
}

export interface SvargaRequest {
  mode: SvargaMode;
  locale?: string;
  userId?: string;
  conversationId?: string;
}

export interface SvargaResponseMeta {
  mode: SvargaMode;
  provider: string;
  model: string;
  sources: SvargaSource[];
  confidence: "high" | "medium" | "low";
}
