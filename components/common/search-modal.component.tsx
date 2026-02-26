import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { profileSearchIndex } from "@/public/search-index";

const PROFILE_SEARCH_INDEX = profileSearchIndex;

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onOpenChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) setQuery("");
  }, [open]);

  const results =
    query.trim() === ""
      ? []
      : PROFILE_SEARCH_INDEX.filter(item =>
          item.value.toLowerCase().includes(query.toLowerCase())
        );

  const handleResultClick = (item: typeof PROFILE_SEARCH_INDEX[0]) => {
    onOpenChange(false);
    // Pass highlight key and search query as query params
    router.push(`${item.page}?highlight=${encodeURIComponent(item.key)}&q=${encodeURIComponent(query)}`);
    // The page should handle scrolling/highlighting
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <Input
          ref={inputRef}
          placeholder="Type to search..."
          className="mt-2"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="mt-4 max-h-60 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="text-muted-foreground text-sm">No results found.</div>
          )}
          {results.map(item => (
            <button
              key={item.key}
              className="block w-full text-left px-2 py-1 rounded hover:bg-muted"
              onClick={() => handleResultClick(item)}
            >
              <div className="font-medium">
                {highlightCharacters(item.value, query)}
              </div>
              <div className="text-xs text-muted-foreground">{item.page}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function highlightCharacters(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="search-highlight">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
} 