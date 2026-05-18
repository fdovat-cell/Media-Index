import { useState, useEffect, useRef } from "react";
import { ContentRow, NoteRow } from "@/lib/database.types";
import { X, Star, Send, ExternalLink } from "lucide-react";
import { useComments, useMutateComments } from "@/hooks/use-data";
import { format } from "date-fns";

type DetailPopupProps = {
  item: ContentRow | NoteRow | null;
  onClose: () => void;
};

function getPlatformUrl(platform: string, title: string): string {
  const encoded = encodeURIComponent(title);
  const p = platform.toLowerCase();
  if (p.includes("netflix")) return `https://www.netflix.com/search?q=${encoded}`;
  if (p.includes("hbo") || p.includes("max")) return `https://www.max.com/search?q=${encoded}`;
  if (p.includes("prime") || p.includes("amazon")) return `https://www.primevideo.com/search?phrase=${encoded}`;
  if (p.includes("disney")) return `https://www.disneyplus.com/search?q=${encoded}`;
  if (p.includes("apple")) return `https://tv.apple.com/search?term=${encoded}`;
  if (p.includes("paramount")) return `https://www.paramountplus.com/search/results/${encoded}`;
  if (p.includes("mubi")) return `https://mubi.com/en/films`;
  return "";
}

function getPlatformColor(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("netflix")) return "bg-red-600 hover:bg-red-700";
  if (p.includes("hbo") || p.includes("max")) return "bg-blue-700 hover:bg-blue-800";
  if (p.includes("prime") || p.includes("amazon")) return "bg-sky-500 hover:bg-sky-600";
  if (p.includes("disney")) return "bg-blue-600 hover:bg-blue-700";
  if (p.includes("apple")) return "bg-gray-800 hover:bg-gray-900";
  if (p.includes("paramount")) return "bg-indigo-600 hover:bg-indigo-700";
  return "bg-primary hover:opacity-90";
}

export function DetailPopup({ item, onClose }: DetailPopupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.history.pushState({ popup: true }, "");
    const handlePopState = () => { onClose(); };
    window.addEventListener("popstate", handlePopState);
    return () => { window.removeEventListener("popstate", handlePopState); };
  }, [item, onClose]);

  if (!item) return null;

  const isContent = 'media_type' in item;
  const id = item.id;
  const contentId = isContent ? id : undefined;
  const noteId = !isContent ? id : undefined;

  const { data: comments, isLoading: commentsLoading } = useComments(contentId, noteId);
  const { addComment } = useMutateComments();

  const [authorName, setAuthorName] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentBody.trim()) return;
    addComment.mutate({
      content_id: contentId || null,
      note_id: noteId || null,
      author_name: authorName.trim(),
      body: commentBody.trim()
    }, {
      onSuccess: () => {
        setAuthorName("");
        setCommentBody("");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom-full duration-300">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        <X size={20} />
      </button>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
        {isContent ? (
          <>
            <div className="w-full aspect-video relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : ''})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="px-5 -mt-8 relative z-10 flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">{item.title}</h1>
                {item.original_title && (
                  <p className="text-xs text-muted-foreground italic mt-1">{item.original_title}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {item.release_date && <span>{item.release_date.substring(0, 4)}</span>}
                {item.rating && (
                  <span className="flex items-center text-primary font-medium">
                    <Star size={14} className="mr-1 fill-primary" />
                    {item.rating}
                  </span>
                )}
              </div>

              {/* Botones de plataformas */}
              {item.platforms && item.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.platforms.map((platform) => {
                    const url = getPlatformUrl(platform, item.title);
                    const colorClass = getPlatformColor(platform);
                    return url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${colorClass}`}
                      >
                        <ExternalLink size={14} />
                        Ver en {platform}
                      </a>
                    ) : (
                      <span
                        key={platform}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-border text-sm font-semibold text-muted-foreground"
                      >
                        {platform}
                      </span>
                    );
                  })}
                </div>
              )}

              {item.personal_review && (
                <div className="p-4 rounded-lg bg-card border border-card-border mt-2">
                  <p className="text-foreground italic">"{item.personal_review}"</p>
                </div>
              )}

              {item.overview && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sinopsis</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.overview}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {item.image_url && (
              <div className="w-full aspect-video relative">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image_url})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
            )}

            <div className={`px-5 relative z-10 flex flex-col gap-6 pb-6 ${item.image_url ? '-mt-8' : 'pt-16'}`}>
              <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">{item.title}</h1>
              <div className="prose prose-invert max-w-none text-gray-300">
                {item.body.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sección de comentarios */}
        <div className="mt-8 px-5 pb-12 border-t border-border pt-6">
          <h3 className="text-lg font-bold mb-4">Comentarios</h3>

          <div className="flex flex-col gap-4 mb-6">
            {commentsLoading ? (
              <div className="text-center text-muted-foreground text-sm">Cargando comentarios...</div>
            ) : comments && comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id} className="bg-card p-3 rounded-lg border border-card-border">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-primary">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd MMM')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{comment.body}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-4 italic">
                Aún no hay comentarios. Sé el primero.
              </div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Tu nombre..."
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              className="bg-card border border-card-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              required
            />
            <div className="relative">
              <textarea
                placeholder="Agrega un comentario..."
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                className="bg-card border border-card-border rounded-md px-3 py-2 text-sm w-full min-h-[80px] focus:outline-none focus:border-primary resize-none"
                required
              />
              <button
                type="submit"
                disabled={addComment.isPending || !authorName.trim() || !commentBody.trim()}
                className="absolute bottom-2 right-2 p-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
