import ReactMarkdown from 'react-markdown';
wimport type { Components } from 'react-markdown';

/**
 * Custom components for ReactMarkdown that process markdown inside code blocks
 */
const markdownCodeComponents: Components = {
  code: ({ children, className, ...props }) => {
    // If it's a code block (has className), process markdown inside it
    if (className) {
      const codeContent = typeof children === 'string' 
        ? children 
        : Array.isArray(children) 
          ? children.map(c => typeof c === 'string' ? c : String(c)).join('')
          : String(children);
      
      return (
        <code className={className} {...props}>
          <ReactMarkdown>
            {codeContent}
          </ReactMarkdown>
        </code>
      );
    }
    // Inline code - no markdown processing
    return <code {...props}>{children}</code>;
  },
};

interface MarkdownProps {
  children: string;
}

/**
 * Markdown component that processes markdown with support for markdown inside code blocks
 */
export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown components={markdownCodeComponents}>
      {children}
    </ReactMarkdown>
  );
}

