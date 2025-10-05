'use client';

import React, { createContext, useContext, useState } from 'react';

interface DiagramExpansionContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const DiagramExpansionContext = createContext<DiagramExpansionContextType | undefined>(undefined);

export function DiagramExpansionProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <DiagramExpansionContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </DiagramExpansionContext.Provider>
  );
}

export function useDiagramExpansion() {
  const context = useContext(DiagramExpansionContext);
  if (!context) {
    throw new Error('useDiagramExpansion must be used within DiagramExpansionProvider');
  }
  return context;
}

