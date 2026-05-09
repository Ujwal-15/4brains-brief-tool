// Shared types for the flowchart generator. The interface below is what
// every implementation has to satisfy — we currently ship the keyword-based
// generator and intend to swap in an LLM-backed one later.

export type NodeKind =
  | "terminal" // Shift start / Back to search — gray
  | "main" // Setup, Search, Capture, Selection, Display — blue
  | "warning" // Disambiguation — orange
  | "error" // Not found, Failure — red
  | "processing" // Preview, Printing, Loading, AI process — purple
  | "success"; // Success, Complete, Done — green

export type UxNode = {
  id: string;
  kind: NodeKind;
  title: string; // bold heading (e.g. "Scanning screen")
  subtitle?: string; // small caption (e.g. "QR scan via iPad")
};

export type UxEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type UxGraph = {
  nodes: UxNode[];
  edges: UxEdge[];
};

export interface FlowchartGenerator {
  /** Convert a CS-typed user-journey blob into a UX graph. */
  generate(userJourney: string): UxGraph;
}
