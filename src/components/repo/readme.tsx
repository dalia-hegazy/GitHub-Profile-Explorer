import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Card } from "@/components/ui/card";

interface ReadmeProps {
  content: string | null;
}

export function Readme({ content }: ReadmeProps) {
  return (
    <section aria-label="Readme" className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">README</h2>
      <Card className="p-6">
        {content === null ? (
          <p className="text-muted-foreground">This repository has no README.</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </Card>
    </section>
  );
}
