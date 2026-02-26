import React from "react";

export const ContentNotFound = ({
  message = "No content found",
}: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center text-muted-foreground text-lg">{message}</div>
    </div>
  );
};