import React from "react";

export const BlogContentRenderer: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  if (!htmlContent?.trim()) {
    return <p className="text-gray-400">No content available.</p>;
  }

  return (
    <div
      className="blog-content max-w-none text-purple-one break-words overflow-hidden"
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
