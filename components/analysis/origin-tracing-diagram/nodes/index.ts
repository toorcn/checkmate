/**
 * Node Components for Origin Tracing Diagram
 * 
 * Export all node types and the nodeTypes configuration object
 */

export { OriginNode } from './OriginNode';
export { PropagationNode } from './PropagationNode';
export { EvolutionNode } from './EvolutionNode';
export { ClaimNode } from './ClaimNode';
export { SourceNode } from './SourceNode';
export { BeliefDriverNode } from './BeliefDriverNode';

import { OriginNode } from './OriginNode';
import { PropagationNode } from './PropagationNode';
import { EvolutionNode } from './EvolutionNode';
import { ClaimNode } from './ClaimNode';
import { SourceNode } from './SourceNode';
import { BeliefDriverNode } from './BeliefDriverNode';

export const nodeTypes = {
  origin: OriginNode,
  propagation: PropagationNode,
  evolution: EvolutionNode,
  claim: ClaimNode,
  source: SourceNode,
  beliefDriver: BeliefDriverNode,
};

