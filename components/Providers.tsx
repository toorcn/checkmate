import { ThemeProvider } from "next-themes";
import { DiagramExpansionProvider } from "@/lib/hooks/useDiagramExpansion";
import { AuthProvider } from "@/lib/hooks/use-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DiagramExpansionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </DiagramExpansionProvider>
    </AuthProvider>
  );
}
