import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// Allow the language class on code blocks through the sanitizer so highlighting still works.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[\w+#-]+$/]],
  },
};

/** Renders user Markdown safely: raw HTML is not parsed, and the output tree is sanitized before highlighting. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-td">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema], [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{ a: ({ href, children }) => <a href={href} rel="nofollow noopener noreferrer" target="_blank">{children}</a> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
