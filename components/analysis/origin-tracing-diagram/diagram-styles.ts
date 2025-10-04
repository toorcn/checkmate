/**
 * Diagram Styles
 * 
 * CSS styles for the origin tracing diagram
 */

export const diagramStyles = `
  .react-flow-mobile-container {
    position: relative;
    width: 100% !important;
    height: 100% !important;
  }
  .react-flow-mobile-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Fullscreen styles */
  .react-flow-fullscreen-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 9999 !important;
    background: white !important;
    width: 100vw !important;
    height: 100vh !important;
  }
  
  .react-flow-fullscreen-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Fullscreen sidebar styling */
  .fullscreen-sidebar {
    border-left: 1px solid #e5e7eb;
    background: white;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Node highlighting animations */
  .react-flow__node {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), z-index 0s;
    will-change: transform;
  }
  
  .react-flow__node.node-highlighted {
    z-index: 1000 !important;
    transform: scale(1.15);
    transform-origin: center center;
  }
  
  .react-flow__node.node-highlighted > div {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 
                0 0 20px rgba(59, 130, 246, 0.4),
                0 10px 30px rgba(0, 0, 0, 0.2) !important;
    border-color: #3b82f6 !important;
    border-width: 3px !important;
    transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
                border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), 
                border-width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    will-change: box-shadow, border-color;
  }
  
  .react-flow__node.node-highlighted > div::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border: 2px solid #3b82f6;
    border-radius: 16px;
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
    opacity: 0;
  }
  
  .react-flow__node.node-highlighted > div::before {
    opacity: 1;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.05);
    }
  }
  
  /* Controls positioning and sizing */
  .react-flow__controls {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    height: auto !important;
    width: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
  }
  
  .react-flow__controls button,
  .react-flow__controls .react-flow__controls-button {
    width: 32px !important;
    height: 32px !important;
    min-height: 32px !important;
    border-radius: 4px !important;
    border: 1px solid #ddd !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    color: #374151 !important;
    transition: all 0.2s ease !important;
  }
  
  .react-flow__controls button:hover,
  .react-flow__controls .react-flow__controls-button:hover {
    background: #f9fafb !important;
    border-color: #9ca3af !important;
  }
  
  /* Resizer styles */
  .split-view-resizer {
    width: 8px;
    cursor: col-resize;
    background: #e5e7eb;
    position: relative;
    transition: background 0.2s;
  }
  
  .split-view-resizer:hover {
    background: #9ca3af;
  }
  
  .split-view-resizer::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 40px;
    background: white;
    border-radius: 2px;
  }
  
  @media (max-width: 640px) {
    .react-flow__controls {
      bottom: 10px !important;
      top: auto !important;
      right: 10px !important;
    }
    
    .react-flow__controls button,
    .react-flow__controls .react-flow__controls-button {
      width: 36px !important;
      height: 36px !important;
      min-height: 36px !important;
    }
  }
`;

