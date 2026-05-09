// Public entry point — callers just call generateFlowchart(text).
//
// To swap in an LLM-backed generator later: replace `defaultGenerator`
// below and leave everything else alone.

import { keywordGenerator } from "./keyword";
import { graphToMermaid } from "./mermaid";
import type { FlowchartGenerator } from "./types";

const defaultGenerator: FlowchartGenerator = keywordGenerator;

export function generateFlowchart(userJourney: string): string {
  const graph = defaultGenerator.generate(userJourney);
  return graphToMermaid(graph);
}

export type { UxGraph, UxNode, UxEdge, NodeKind, FlowchartGenerator } from "./types";
