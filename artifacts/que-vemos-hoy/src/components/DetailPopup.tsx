import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContentRow, NoteRow } from "@/lib/database.types";
import { X, Star, Send, ExternalLink, Share2, Play } from "lucide-react";
import { useComments, useMutateComments, useRatings, useMutateRatings } from "@/hooks/use-data";
import { format } from "date-fns";

type DetailPopupProps = {
  item: ContentRow | NoteRow | null;
  onClose: () => void;
};

const TMDB_TOKEN = import.meta.env.VITE_TMDB_BEARER_TOKEN;

function useTrailer(tmdbId: number | null, mediaType: "movie" | "tv" | null) {
  return useQuery({
    queryKey: ["trailer", tmdbId, mediaType],
    queryFn: async () => {
      if (!tmdbId || !mediaType || !TMDB_TOKEN) return null;
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?language=es-419`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const trailer = (data.results || []).find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      );
      if (trailer) return trailer.key as string;
      // fallback: English
      const res2 = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?language=en-US`,
        { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" } }
      );
      if (!res2.ok) return null;
      const data2 = await res2.json();
      const trailer2 = (data2.results || []).find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
      );
      return trailer2?.key ?? null;
    },
    enabled: !!tmdbId && !!mediaType,
  });
}

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

function StarRating({ contentId, title }: { contentId: string; title: string }) {
  const { data: ratingsData } = useRatings(contentId);
  const { addRating } = useMutateRatings();
  const [hovered, setHovered] = useState<number | null>(null);
  const storageKey = `rated_${contentId}`;
  const alreadyRated = !!localStorage.getItem(storageKey);
  const [hasRated, setHasRated] = useState(alreadyRated);

  const handleRate = (score: number) => {
    if (hasRated) return;
    addRating.mutate({ contentId, score }, {
      onSuccess: () => {
        localStorage.setItem(storageKey, "1");
        setHasRated(true);
      }
    });
  };

  const displayScore = hovered ?? (ratingsData?.average ?? 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={hasRated}
              onClick={() => handleRate(star)}
              onMouseEnter={() => !hasRated && setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              className={`transition-transform ${!hasRated ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
            >
              <Star
                size={22}
                className={`transition-colors ${
                  star <= displayScore
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        {ratingsData && ratingsData.count > 0 && (
          <span className="text-xs text-muted-foreground">
            {ratingsData.average} · {ratingsData.count} {ratingsData.count === 1 ? "voto" : "votos"}
          </span>
        )}
      </div>
      {hasRated && <p className="text-xs text-primary">Ya votaste esta película.</p>}
      {!hasRated && <p className="text-xs text-muted-foreground">Tocá las estrellas para valorar</p>}
    </div>
  );
}

function ShareButton({ title, review }: { title: string; review?: string | null }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = review
      ? `🎬 ${title}\n"${review}"\n\nVía Qué Vemos Hoy → ${window.location.href}`
      : `🎬 ${title}\n\nVía Qué Vemos Hoy → ${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white transition-colors text-sm"
    >
      <Share2 size={14} />
      {copied ? "¡Copiado!" : "Compartir"}
    </button>
  );
}

export function DetailPopup({ item, onClose }: DetailPopupProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!item) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setShowTrailer(false);
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
  const { data: trailerKey } = useTrailer(
    isContent ? (item as ContentRow).tmdb_id : null,
    isContent ? (item as ContentRow).media_type : null
  );

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
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center md:p-6 bg-black/70">
      <div className="bg-background w-full md:max-w-xl md:rounded-2xl flex flex-col md:max-h-[90vh] animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
          {isContent ? (
            <>
              {/* Imagen / Trailer */}
              <div className="w-full relative bg-black" style={{ aspectRatio: "16/9", maxHeight: "280px" }}>
                {showTrailer && trailerKey ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${(item as ContentRow).backdrop_path
                          ? `https://image.tmdb.org/t/p/original${(item as ContentRow).backdrop_path}`
                          : (item as ContentRow).poster_path
                          ? `https://image.tmdb.org/t/p/w500${(item as ContentRow).poster_path}`
                          : ''})`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    {trailerKey && (
                      <button
                        onClick={() => setShowTrailer(true)}
                        className="absolute inset-0 flex items-center justify-center group"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors border border-white/30">
                          <Play size={22} className="text-white fill-white ml-1" />
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 -mt-8 relative z-10 flex flex-col gap-4 pb-2">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">{(item as ContentRow).title}</h1>
                  {(item as ContentRow).original_title && (
                    <p className="text-xs text-muted-foreground italic mt-1">{(item as ContentRow).original_title}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {(item as ContentRow).release_date && <span>{(item as ContentRow).release_date!.substring(0, 4)}</span>}
                  {(item as ContentRow).rating && (
                    <span className="flex items-center text-primary font-medium">
                      <Star size={14} className="mr-1 fill-primary" />
                      {(item as ContentRow).rating} TMDB
                    </span>
                  )}
                </div>

                {/* Botones plataformas + compartir */}
                <div className="flex flex-wrap gap-2">
                  {(item as ContentRow).platforms?.map((platform) => {
                    const url = getPlatformUrl(platform, (item as ContentRow).title);
                    const colorClass = getPlatformColor(platform);
                    return url ? (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${colorClass}`}
                      >
                        <ExternalLink size={13} />
                        {platform}
                      </a>
                    ) : (
                      <span key={platform} className="px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground">
                        {platform}
                      </span>
                    );
                  })}
                  <ShareButton title={(item as ContentRow).title} review={(item as ContentRow).personal_review} />
                </div>

                {/* Valoración */}
                <div className="p-4 rounded-lg bg-card border border-card-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tu valoración</p>
                  <StarRating contentId={id} title={(item as ContentRow).title} />
                </div>

                {(item as ContentRow).personal_review && (
                  <div className="p-4 rounded-lg bg-card border border-card-border">
                    <p className="text-foreground italic">"{(item as ContentRow).personal_review}"</p>
                  </div>
                )}

                {(item as ContentRow).overview && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sinopsis</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{(item as ContentRow).overview}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {(item as NoteRow).image_url && (
                <div className="w-full relative bg-black" style={{ aspectRatio: "16/9", maxHeight: "280px" }}>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${(item as NoteRow).image_url})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
              )}

              <div className={`px-5 relative z-10 flex flex-col gap-4 pb-6 ${(item as NoteRow).image_url ? '-mt-8' : 'pt-16'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-white leading-tight flex-1">{(item as NoteRow).title}</h1>
                  <ShareButton title={(item as NoteRow).title} />
                </div>
                <div className="prose prose-invert max-w-none text-gray-300">
                  {(item as NoteRow).body.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Comentarios */}
          <div className="mt-4 px-5 pb-12 border-t border-border pt-6">
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
    </div>
  );
}
