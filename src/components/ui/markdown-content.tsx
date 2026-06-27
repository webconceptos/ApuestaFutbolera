import ReactMarkdown from "react-markdown";

// react-markdown no renderiza HTML embebido por defecto (a menos que se
// agregue rehype-raw explícitamente) — eso es justo lo que queremos acá: el
// texto lo escribe el dueño de la polla, así que se evita XSS sin tener que
// sanitizar nada a mano. Mapeo manual de elementos a clases del sistema de
// diseño en vez de @tailwindcss/typography (no instalado, no hace falta para
// un solo campo de texto).
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="font-display text-xl tracking-wide text-text-primary">{children}</h1>,
          h2: ({ children }) => <h2 className="font-display text-lg tracking-wide text-text-primary">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-text-primary">{children}</h3>,
          p: ({ children }) => <p className="text-text-muted">{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 text-text-muted">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 text-text-muted">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold-start underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-bg-glass px-1 py-0.5 font-mono text-xs text-text-primary">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border-glass pl-3 italic text-text-muted">{children}</blockquote>
          ),
          hr: () => <hr className="border-border-glass" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
