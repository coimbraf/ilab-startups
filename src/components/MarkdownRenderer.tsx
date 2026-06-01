import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  children: string;
  className?: string;
}

export default function MarkdownRenderer({ children, className = '' }: Props) {
  return (
    <div className={`prose prose-sm max-w-none text-graphite
      [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:font-playfair [&_h1]:mb-3
      [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2
      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2
      [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:text-graphite/80
      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
      [&_li]:text-graphite/80
      [&_strong]:font-bold [&_strong]:text-graphite
      [&_em]:italic
      [&_a]:text-fox [&_a]:font-medium [&_a]:hover:underline
      [&_blockquote]:border-l-4 [&_blockquote]:border-fox/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-graphite/60 [&_blockquote]:my-3
      [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
      [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:my-3
      [&_hr]:border-gray-200 [&_hr]:my-4
      [&_img]:rounded-xl [&_img]:max-w-full [&_img]:shadow-sm
      ${className}`}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
