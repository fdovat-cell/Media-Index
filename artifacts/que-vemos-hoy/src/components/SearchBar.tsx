import { useState } from "react";
import { Search, X } from "lucide-react";
import { useLocalSearch } from "@/hooks/use-data";
import { ContentRow, NoteRow } from "@/lib/database.types";

interface Props {
  onSelectContent?: (item: ContentRow) => void;
  onSelectNote?: (item: NoteRow) => void;
  placeholder?: string;
}

export function SearchBar({ onSelectContent, onSelectNote, placeholder = "Buscar..." }: Props) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useLocalSearch(query);
  const hasResults = (data?.content.length ?? 0) + (data?.notes.length ?? 0) > 0;

  const clear = () => setQuery("");

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary text-white placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full z-50 bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center p-4">Buscando...</p>
          ) : hasResults ? (
            <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-border/50">
              {(data?.content ?? []).map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelectContent?.(item); clear(); }}
                  className="w-full flex gap-3 items-center p-3 hover:bg-background transition-colors text-left"
                >
                  <div
                    className="w-8 h-11 bg-muted rounded flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : "none" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-primary uppercase tracking-wider mt-0.5">{item.section}</p>
                  </div>
                </button>
              ))}
              {(data?.notes ?? []).map(note => (
                <button
                  key={note.id}
                  onClick={() => { onSelectNote?.(note); clear(); }}
                  className="w-full flex gap-3 items-center p-3 hover:bg-background transition-colors text-left"
                >
                  {note.image_url ? (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${note.image_url})` }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Search size={12} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{note.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{note.excerpt ?? "Nota"}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center p-4">
              Sin resultados para "<span className="text-white">{query}</span>"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
