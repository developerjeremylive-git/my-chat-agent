import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageViewProps {
    text: string;
    onCopy?: () => void;
}

export function MessageView({ text, onCopy }: MessageViewProps) {
    const [isMarkdownView, setIsMarkdownView] = useState(false);

    const renderContent = () => {
        if (isMarkdownView) {
            return (
                <ReactMarkdown
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
                        p: ({ node, ...props }) => <p className="my-2" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="my-1" {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />,
                    }}
                >
                    {text}
                </ReactMarkdown>
            );
        }

        return <p className="whitespace-pre-wrap transition-all duration-300">{text}</p>;
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="markdown-content">
                {renderContent()}
            </div>
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setIsMarkdownView(!isMarkdownView)}
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-300 ${isMarkdownView
                            ? 'bg-[#F48120] text-white hover:bg-[#E37110]'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                        }`}
                >
                    {isMarkdownView ? 'Vista Markdown' : 'Vista Simple'}
                </button>
                {onCopy && (
                    <button
                        onClick={onCopy}
                        className="px-3 py-1 text-xs text-white bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 rounded-md transition-colors"
                    >
                        Copiar
                    </button>
                )}
            </div>
        </div>
    );
}