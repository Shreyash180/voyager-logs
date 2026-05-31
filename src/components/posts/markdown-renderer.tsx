import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className="prose prose-invert max-w-none space-y-4"
      components={{
        h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
        h4: ({ children }) => <h4 className="text-lg font-bold mt-3 mb-2">{children}</h4>,
        h5: ({ children }) => <h5 className="text-base font-bold mt-2 mb-2">{children}</h5>,
        h6: ({ children }) => <h6 className="text-sm font-bold mt-2 mb-2">{children}</h6>,
        p: ({ children }) => <p className="leading-7 text-foreground/90">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 text-foreground/90 ml-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 text-foreground/90 ml-2">{children}</ol>
        ),
        li: ({ children }) => <li className="ml-2">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-cyan-400 pl-4 py-2 my-4 italic text-foreground/75 bg-white/5 rounded-r">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded border border-white/10 bg-black/50 px-1.5 py-0.5 font-mono text-sm text-cyan-300">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="bg-black/50 border border-white/15 rounded-lg p-4 overflow-x-auto my-3 text-sm text-cyan-300 font-mono">
            {children}
          </pre>
        ),
        hr: () => <hr className="my-4 border-t border-white/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
