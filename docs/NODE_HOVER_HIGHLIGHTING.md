# Node Hover Highlighting Feature

## Overview

The origin tracing diagram includes an intelligent hover highlighting system that highlights nodes and their connected edges/nodes based on user interaction. The system automatically adapts its behavior based on the current interaction mode.

## Features

### 1. Manual Hover Highlighting

When hovering over a node (either in the graph or sidebar), the system highlights:
- The hovered node itself
- All directly connected nodes
- All edges connecting to/from the hovered node
- All other nodes and edges are dimmed for better focus

**Special Case: Current Claim Node**
- The current claim node (center node) has special behavior
- When hovering over it, **only the node itself is highlighted**
- Its connections (edges and connected nodes) are **not highlighted**
- This prevents visual clutter since the claim node connects to many other nodes

### 2. Auto-Panning Mode (Animation)

When the diagram is in auto-panning animation mode:
- The hover highlighting automatically follows the currently focused node
- Manual hover interactions are disabled during animation
- The highlight smoothly transitions as the animation progresses through nodes
- **Only incoming connections are highlighted** (where the node came from, not where it's going)
- This creates a narrative flow visualization showing the evolution path up to the current node

### 3. Panning Mode

When the user is actively panning/dragging the diagram:
- Hover highlighting is temporarily disabled
- This prevents distracting visual changes while navigating
- Highlighting re-enables immediately after panning stops

## Implementation Details

### Hook: `useNodeHoverHighlight`

```typescript
type HighlightMode = 'all' | 'incoming' | 'self';

interface UseNodeHoverHighlightProps {
  nodes: Node[];
  edges: Edge[];
  disabled?: boolean;        // Disable during panning
  forcedNodeId?: string | null;  // Force highlight during animation
  highlightMode?: HighlightMode;  // Control which connections to highlight
}
```

**Parameters:**
- `disabled`: When `true`, all manual hover interactions are ignored
- `forcedNodeId`: When provided, forces the highlight to show this specific node and its connections
- `highlightMode`: Controls the direction of highlighting:
  - `'all'`: Highlights all connections (incoming and outgoing) - default for manual hover
  - `'incoming'`: Highlights only incoming connections - used during animation to show flow
  - `'self'`: Highlights only the node itself with no connections

**Behavior:**
1. If `forcedNodeId` is provided, it takes priority over manual hover
2. If `disabled` is `true`, manual hover events are ignored
3. The `highlightMode` determines which connections are shown
4. During animation, `'incoming'` mode shows the narrative path leading to the current node
5. **Claim nodes** (type `'claim'`) automatically use `'self'` mode regardless of the specified `highlightMode`

### Integration in OriginTracingDiagram

The diagram component tracks two key states:
- `isPanning`: Tracks when user is actively panning (via `onMoveStart`/`onMoveEnd`)
- `isAnimating`: Tracks when auto-panning animation is running

These states are passed to the hover highlight hook:
```typescript
useNodeHoverHighlight({
  nodes,
  edges,
  disabled: isPanning,
  forcedNodeId: isAnimating ? focusedNodeId : null,
  highlightMode: isAnimating ? 'incoming' : 'all',
})
```

This configuration ensures that:
- During manual hover, users see all connections (`'all'` mode)
- During animation, users see only where the current node came from (`'incoming'` mode)
- During panning, highlighting is disabled entirely

### CSS Classes Applied

The hook returns sets of highlighted elements, which are used to apply CSS classes:

**Nodes:**
- `node-connected`: Applied to highlighted nodes
- `node-dimmed`: Applied to non-highlighted nodes
- `node-highlighted`: Applied by animation system to the focused node

**Edges:**
- `edge-highlighted`: Applied to highlighted edges
- `edge-dimmed`: Applied to non-highlighted edges

## User Experience

### Normal Browsing
Users can hover over nodes to explore connections and relationships in the diagram.

### During Animation
Users can watch as the system automatically highlights the narrative flow, with each node and its **incoming connections** (previous steps) highlighted in sequence. This creates a clear visualization of "how we got here" at each step of the evolution timeline.

### During Navigation
Users can freely pan and zoom without visual distractions from the hover system.

## Benefits

1. **Context Awareness**: The system automatically adapts to user intent
2. **Focus Enhancement**: Highlights relevant information while dimming noise
3. **Narrative Flow**: During animation, shows the evolution path without spoiling future steps
4. **Directional Control**: Separate tracking of incoming vs outgoing connections
5. **Smooth Transitions**: Clean visual experience across interaction modes
6. **Performance**: Efficient adjacency map for instant lookups
7. **Accessibility**: Clear visual feedback for exploration
8. **Reduced Clutter**: Special handling for the claim node prevents overwhelming visual connections

## Future Enhancements

Potential improvements:
- Configurable highlight radius (N-degree connections)
- Different highlight styles for different edge types
- Persistent highlight on click (lock selection)
- Multi-node highlight support
- User preference for highlight mode during animation (incoming vs all)
- Animated transition effects when switching between modes
