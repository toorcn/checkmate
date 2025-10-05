/**
 * Diagram Styles
 * 
 * Enhanced CSS styles for a polished, professional origin tracing diagram
 */

export const diagramStyles = `
  /* Container Styles */
  .react-flow-mobile-container {
    position: relative;
    width: 100% !important;
    height: 100% !important;
  }
  
  .react-flow-mobile-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  /* Expanded Styles - Scroll-triggered full width expansion */
  .react-flow-expanded-container {
    position: relative !important;
    width: 100vw !important;
    height: 700px !important;
    margin-left: calc(-50vw + 50%) !important;
    margin-right: calc(-50vw + 50%) !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    z-index: 100 !important;
  }
  
  .react-flow-expanded-container .react-flow__viewport {
    width: 100% !important;
    height: 100% !important;
  }
  
  @media (min-width: 640px) {
    .react-flow-expanded-container {
      height: 600px !important;
    }
  }
  
  @media (min-width: 768px) {
    .react-flow-expanded-container {
      height: 700px !important;
    }
  }
  
  /* Expanded Sidebar */
  .expanded-sidebar {
    border-left: 1px solid #e2e8f0;
    background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.06);
  }
  
  /* Enhanced Node Styles */
  .react-flow__node {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                filter 0.2s ease-in-out,
                z-index 0s;
    will-change: transform, filter;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
  }
  
  .react-flow__node:hover {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12));
    cursor: pointer;
  }
  
  /* Node Highlighting with Premium Animation */
  .react-flow__node.node-highlighted {
    z-index: 1000 !important;
    transform: scale(1.12);
    transform-origin: center center;
    filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.25));
  }
  
  .react-flow__node.node-highlighted > div {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 
                0 0 0 6px rgba(59, 130, 246, 0.1),
                0 12px 36px rgba(59, 130, 246, 0.2),
                0 20px 48px rgba(0, 0, 0, 0.12) !important;
    border-color: #3b82f6 !important;
    border-width: 2px !important;
    transition: box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                border-color 0.3s ease, 
                border-width 0.3s ease,
                transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    will-change: box-shadow, border-color, transform;
  }
  
  /* Pulsing Ring Animation */
  .react-flow__node.node-highlighted > div::before {
    content: '';
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border: 2px solid #3b82f6;
    border-radius: 18px;
    animation: pulseRing 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    pointer-events: none;
    opacity: 0;
  }
  
  .react-flow__node.node-highlighted > div::before {
    opacity: 1;
  }
  
  @keyframes pulseRing {
    0% {
      opacity: 1;
      transform: scale(0.95);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.02);
    }
    100% {
      opacity: 1;
      transform: scale(0.95);
    }
  }
  
  /* Enhanced Edge Styles with Better Visibility */
  .react-flow__edge-path {
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke-width 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  .react-flow__edge:hover .react-flow__edge-path {
    stroke-width: 4px !important;
    opacity: 1 !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
  
  .react-flow__edge.animated .react-flow__edge-path {
    stroke-dasharray: 8;
    animation: edgeAnimation 1.5s linear infinite;
  }
  
  @keyframes edgeAnimation {
    to {
      stroke-dashoffset: -16;
    }
  }
  
  /* Highlighted Edge Styles (when connected to hovered node) */
  .react-flow__edge.edge-highlighted .react-flow__edge-path {
    stroke-width: 3.5px !important;
    opacity: 1 !important;
    filter: drop-shadow(0 3px 8px rgba(59, 130, 246, 0.4));
    animation: edgeHighlightPulse 2s ease-in-out infinite;
  }
  
  .react-flow__edge.edge-highlighted marker path {
    fill: currentColor;
    opacity: 1 !important;
  }
  
  @keyframes edgeHighlightPulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }
  
  /* Dimmed edges when another node is hovered */
  .react-flow__edge.edge-dimmed .react-flow__edge-path {
    opacity: 0.15 !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
  }
  
  /* Connected node highlighting (dimmed non-connected nodes) */
  .react-flow__node.node-dimmed {
    opacity: 0.3;
    filter: grayscale(0.5);
    transition: opacity 0.2s ease, filter 0.2s ease;
  }
  
  .react-flow__node.node-connected {
    opacity: 1;
    filter: none;
    transition: opacity 0.2s ease, filter 0.2s ease;
  }
  
  /* Enhanced edge text background */
  .react-flow__edge-textbg {
    fill: white;
    fill-opacity: 0.95;
    rx: 4;
  }
  
  .react-flow__edge-text {
    font-size: 11px;
    font-weight: 600;
    fill: #475569;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
  
  /* Marker (arrow) enhancement */
  .react-flow__edge .react-flow__edge-path {
    stroke-opacity: inherit;
  }
  
  marker {
    opacity: inherit;
  }
  
  /* Premium Control Buttons */
  .react-flow__controls {
    position: absolute !important;
    top: 16px !important;
    right: 16px !important;
    height: auto !important;
    width: auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    padding: 8px !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 
                0 2px 8px rgba(0, 0, 0, 0.04) !important;
    border: 1px solid rgba(226, 232, 240, 0.8) !important;
  }
  
  .react-flow__controls button,
  .react-flow__controls .react-flow__controls-button {
    width: 36px !important;
    height: 36px !important;
    min-height: 36px !important;
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    color: #475569 !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  .react-flow__controls button:hover,
  .react-flow__controls .react-flow__controls-button:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    color: #1e293b !important;
  }
  
  .react-flow__controls button:active,
  .react-flow__controls .react-flow__controls-button:active {
    transform: translateY(0) !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
  }
  
  .react-flow__controls svg {
    width: 16px !important;
    height: 16px !important;
  }
  
  /* Enhanced Resizer */
  .split-view-resizer {
    width: 10px;
    cursor: col-resize;
    background: linear-gradient(to right, 
                rgba(226, 232, 240, 0.4) 0%, 
                rgba(226, 232, 240, 0.8) 50%, 
                rgba(226, 232, 240, 0.4) 100%);
    position: relative;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .split-view-resizer:hover {
    background: linear-gradient(to right, 
                rgba(148, 163, 184, 0.5) 0%, 
                rgba(148, 163, 184, 1) 50%, 
                rgba(148, 163, 184, 0.5) 100%);
    width: 12px;
  }
  
  .split-view-resizer::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 48px;
    background: linear-gradient(to bottom,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.9) 50%,
                rgba(255, 255, 255, 0) 100%);
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  }
  
  /* Handle Styles */
  .react-flow__handle {
    width: 10px !important;
    height: 10px !important;
    background: #3b82f6 !important;
    border: 2px solid white !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
    transition: all 0.2s ease !important;
  }
  
  .react-flow__handle:hover {
    width: 12px !important;
    height: 12px !important;
    background: #2563eb !important;
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.4) !important;
  }
  
  /* Background Pattern Enhancement */
  .react-flow__background {
    background-color: transparent;
  }
  
  /* Mobile Responsive Adjustments */
  @media (max-width: 640px) {
    .react-flow__controls {
      bottom: 16px !important;
      top: auto !important;
      right: 16px !important;
    }
    
    .react-flow__controls button,
    .react-flow__controls .react-flow__controls-button {
      width: 40px !important;
      height: 40px !important;
      min-height: 40px !important;
    }
    
    .split-view-resizer {
      width: 12px;
    }
  }
  
  /* Navigation Sidebar Enhanced Animations */
  
  /* Hero card border glow animation */
  @keyframes heroBorderGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
                  0 0 40px rgba(59, 130, 246, 0.1);
    }
    50% {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5),
                  0 0 60px rgba(59, 130, 246, 0.2);
    }
  }
  
  .hero-glow-border {
    animation: heroBorderGlow 3s ease-in-out infinite;
  }
  
  /* Gradient shimmer for section hovers */
  @keyframes gradientShimmer {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  .section-card-shimmer {
    background-size: 200% 200%;
    animation: gradientShimmer 3s ease infinite;
  }
  
  /* Connection line dash animation */
  @keyframes dashAnimation {
    to {
      stroke-dashoffset: -20;
    }
  }
  
  .connection-line-animated {
    animation: dashAnimation 2s linear infinite;
  }
  
  /* Floating effect on hover */
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  
  .section-card:hover {
    animation: float 2s ease-in-out infinite;
  }
  
  /* Stagger animation for list items */
  @keyframes staggerFadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .stagger-item {
    animation: staggerFadeIn 0.3s ease-out;
  }
  
  /* Spring-based expand/collapse */
  .spring-expand {
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  /* Pulse animation for active indicators */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  .pulse-indicator {
    animation: pulse 2s ease-in-out infinite;
  }
  
  /* Masonry Grid Layout for Items */
  .items-masonry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 16px;
  }
  
  @media (min-width: 768px) {
    .items-masonry-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) and (min-aspect-ratio: 16/9) {
    .items-masonry-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* Item Card Styles */
  .item-masonry-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .item-masonry-card button {
    display: block;
    width: 100%;
  }
  
  /* Card hover glow effect */
  .item-masonry-card button:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12),
                0 0 20px rgba(59, 130, 246, 0.15);
  }
  
  /* Responsive adjustments for masonry */
  @media (max-width: 640px) {
    .items-masonry-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px;
    }
  }
`;

