import { useState, useMemo, useRef, useEffect } from "react";
import { PhoneLayout } from "@/components/layout/PhoneLayout";
import { useContent, useNotes, useApprovedSuggestions, SuggestionRow } from "@/hooks/use-data";
import { useTmdbSearch, useSubmitSuggestion } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRow, NoteRow } from "@/lib/database.types";
import { DetailPopup } from "@/components/DetailPopup";
import { Star, FileText, ChevronLeft, ChevronRight, Search, X, Check, Share2 } from "lucide-react";

const WA_NUMBER = "59896190002";
const WA_TEXT = encodeURIComponent("Hola, vengo de quevemoshoy...");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`;

export default function Home() {
  const { data: heroContent, isLoading: isHeroLoading } = useContent("hero");
  const { data: weeklyContent, isLoading: isWeeklyLoading } = useContent("weekly");
  const { data: classicContent, isLoading: isClassicLoading } = useContent("classic");
  const { data: upcomingContent, isLoading: isUpcomingLoading } = useContent("upcoming");
  const { data: notesContent, isLoading: isNotesLoading } = useNotes();

  const [selectedItem, setSelectedItem] = useState<ContentRow | NoteRow | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [autoOpenId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("v"));

  const notesScrollRef = useRef<HTMLDivElement>(null);

  // Auto-abre el popup si la URL tiene ?v=<id> (para cuando alguien abre un link compartido)
  useEffect(() => {
    if (!autoOpenId || selectedItem) return;
    const all = [...(heroContent || []), ...(weeklyContent || []), ...(classicContent || []), ...(upcomingContent || [])];
    const found = all.find(c => c.id === autoOpenId);
    if (found) { setSelectedItem(found); return; }
    const note = (notesContent || []).find(n => n.id === autoOpenId);
    if (note) setSelectedItem(note);
  }, [autoOpenId, heroContent, weeklyContent, classicContent, upcomingContent, notesContent]);

  // Actualiza la URL cuando se abre/cierra un popup para que el share incluya el contenido
  useEffect(() => {
    if (selectedItem) {
      const title = selectedItem.title;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      history.replaceState({}, "", `?v=${selectedItem.id}&t=${slug}`);
    } else {
      history.replaceState({}, "", window.location.pathname);
    }
  }, [selectedItem]);

  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    [...(weeklyContent || []), ...(classicContent || []), ...(upcomingContent || []), ...(heroContent || [])].forEach(item => {
      item.platforms?.forEach(p => { if (p) platforms.add(p); });
    });
    return Array.from(platforms).sort();
  }, [weeklyContent, classicContent, upcomingContent, heroContent]);

  const filterByPlatform = (items: ContentRow[] | null | undefined) => {
    if (!platformFilter || !items) return items;
    return items.filter(item => item.platforms?.includes(platformFilter));
  };

  const scroll = (ref: React.RefObject<HTMLDivElement>, dir: "left" | "right") => {
    if (ref.current) ref.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <PhoneLayout>
      <div className="flex-1 overflow-y-auto pb-8 no-scrollbar relative">

        {/* HEADER */}
        <header className="px-5 pt-12 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Qué Vemos Hoy</h1>
        </header>

        {/* HERO SECTION */}
        <section className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
          {isHeroLoading ? (
            <Skeleton className="w-full h-full bg-card" />
          ) : heroContent && heroContent.length > 0 ? (
            <div className="w-full h-full relative cursor-pointer" onClick={() => setSelectedItem(heroContent[0])}>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${heroContent[0].backdrop_path
                    ? `https://image.tmdb.org/t/p/original${heroContent[0].backdrop_path}`
                    : heroContent[0].poster_path
                    ? `https://image.tmdb.org/t/p/w500${heroContent[0].poster_path}`
                    : ''})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute top-3 left-4">
                <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Recomendación del día</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full px-4 pb-3 flex flex-col gap-1.5">
                <h2 className="text-xl font-black text-white tracking-tight leading-tight uppercase line-clamp-1">
                  {heroContent[0].title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  {heroContent[0].platforms && heroContent[0].platforms.length > 0 && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{heroContent[0].platforms[0]}</span>
                  )}
                  {heroContent[0].rating && (
                    <span className="flex items-center text-primary">
                      <Star size={12} className="mr-1 fill-primary" /> {heroContent[0].rating}
                    </span>
                  )}
                  {heroContent[0].release_date && (
                    <span className="text-xs text-muted-foreground">{heroContent[0].release_date.substring(0, 4)}</span>
                  )}
                </div>
                {heroContent[0].personal_review && (
                  <p className="text-gray-300 text-xs italic border-l-2 border-primary pl-3 line-clamp-1">
                    "{heroContent[0].personal_review}"
                  </p>
                )}
                <button className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-md w-full mt-0.5 hover:opacity-90 transition-opacity text-sm">
                  Ver reseña completa
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* FILTRO POR PLATAFORMA */}
        {allPlatforms.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-4">
            <button
              onClick={() => setPlatformFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                platformFilter === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-white hover:border-white"
              }`}
            >
              Todas
            </button>
            {allPlatforms.map(platform => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  platformFilter === platform
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-white hover:border-white"
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        )}

        {/* LO MEJOR ESTA SEMANA */}
        <ContentSection
          title="Lo mejor esta semana"
          items={filterByPlatform(weeklyContent)}
          isLoading={isWeeklyLoading}
          onSelect={setSelectedItem}
        />

        {/* IMPERDIBLES */}
        <ContentSection
          title="Imperdibles"
          items={filterByPlatform(classicContent)}
          isLoading={isClassicLoading}
          onSelect={setSelectedItem}
        />

        {/* QUÉ LEEMOS HOY */}
        <section className="py-6 px-4">
          <div className="flex justify-between items-center mb-4 pr-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Qué leemos hoy</h2>
            <div className="flex gap-1">
              <button onClick={() => scroll(notesScrollRef, "left")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => scroll(notesScrollRef, "right")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div ref={notesScrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {isNotesLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="min-w-[280px] h-[160px] rounded-lg bg-card snap-start" />
              ))
            ) : notesContent && notesContent.length > 0 ? (
              notesContent.map(note => (
                <div
                  key={note.id}
                  className="min-w-[280px] w-[280px] bg-card rounded-lg overflow-hidden border border-card-border snap-start cursor-pointer group"
                  onClick={() => setSelectedItem(note)}
                >
                  {note.image_url ? (
                    <div className="w-full h-24 bg-cover bg-center" style={{ backgroundImage: `url(${note.image_url})` }} />
                  ) : (
                    <div className="w-full h-24 bg-muted flex items-center justify-center">
                      <FileText size={32} className="text-muted-foreground opacity-50" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{note.excerpt || note.body}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic">No hay notas publicadas.</div>
            )}
          </div>
        </section>

        {/* PRÓXIMOS ESTRENOS */}
        <ContentSection
          title="Próximos estrenos"
          items={filterByPlatform(upcomingContent)}
          isLoading={isUpcomingLoading}
          onSelect={setSelectedItem}
          showDate
        />

        {/* RECOMENDANOS TU IMPERDIBLE */}
        <SuggestSection />

        {/* WHATSAPP BUTTON */}
        <div className="flex justify-center py-6">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-white transition-colors opacity-50 hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
            Contacto
          </a>
        </div>

        {selectedItem && (
          <DetailPopup item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </PhoneLayout>
  );
}

// ─── Suggestion Detail Popup ──────────────────────────────────────────────────

function SuggestionDetailPopup({ item, onClose }: { item: SuggestionRow; onClose: () => void }) {
  const year = (item.release_date || "").substring(0, 4);
  const tipo = item.media_type === "movie" ? "Película" : "Serie";

  const handleShare = async () => {
    const url = window.location.href;
    const text = `"${item.title}" — recomendado en Qué Vemos Hoy`;
    if (navigator.share) {
      await navigator.share({ title: item.title, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
    }
  };

  useEffect(() => {
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    history.replaceState({}, "", `?v=${item.id}&t=${slug}`);
    return () => { history.replaceState({}, "", window.location.pathname); };
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-card rounded-t-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Poster con título encima */}
        <div className="relative w-full h-64 overflow-hidden bg-muted">
          {item.poster_path && (
            <div
              className="absolute inset-0 bg-cover bg-top"
              style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w500${item.poster_path})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X size={15} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <h2 className="text-xl font-black text-white leading-tight">{item.title}</h2>
            {item.original_title && item.original_title !== item.title && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.original_title}</p>
            )}
            <p className="text-xs text-primary mt-1 font-semibold">{tipo}{year ? ` · ${year}` : ""}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 flex flex-col gap-3">
          {item.suggested_by && (
            <p className="text-xs text-muted-foreground/60 italic">sugerido por {item.suggested_by}</p>
          )}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full border border-border text-muted-foreground hover:text-white hover:border-white rounded-xl py-2.5 text-sm transition-colors"
          >
            <Share2 size={14} /> Compartir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Suggest Section ──────────────────────────────────────────────────────────

function SuggestSection() {
  const [query, setQuery] = useState("");
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [suggesterName, setSuggesterName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionRow | null>(null);
  const { data: searchResults, isLoading: isSearching } = useTmdbSearch(query);
  const submitSuggestion = useSubmitSuggestion();
  const { data: approved, isLoading: isLoadingApproved } = useApprovedSuggestions();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  const handleSelect = (item: any) => {
    setPendingItem(item);
    setQuery("");
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!pendingItem) return;
    submitSuggestion.mutate(
      {
        tmdb_id: pendingItem.id,
        media_type: pendingItem.media_type,
        title: pendingItem.title || pendingItem.name,
        original_title: pendingItem.original_title || pendingItem.original_name || null,
        poster_path: pendingItem.poster_path || null,
        release_date: pendingItem.release_date || pendingItem.first_air_date || null,
        suggested_by: suggesterName.trim() || null,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setPendingItem(null);
          setSuggesterName("");
        },
      }
    );
  };

  return (
    <section className="py-6 px-4">
      <div className="mb-4">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">
          Recomendanos tu imperdible
        </h2>
        <p className="text-[11px] text-muted-foreground/60">
          Buscá una peli o serie y mandanos tu recomendación
        </p>
      </div>

      {submitted && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Check size={14} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">¡Gracias por la sugerencia!</p>
            <p className="text-xs text-muted-foreground">En breve la compartiremos.</p>
          </div>
          <button onClick={() => setSubmitted(false)} className="text-muted-foreground hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {!pendingItem ? (
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar película o serie..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary text-white placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              <X size={13} />
            </button>
          )}
          {query.length >= 3 && (
            <div className="absolute top-full mt-1.5 w-full z-50 bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              {isSearching ? (
                <p className="text-xs text-muted-foreground text-center p-4">Buscando...</p>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto no-scrollbar divide-y divide-border/50">
                  {searchResults.slice(0, 6).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full flex gap-3 items-center p-3 hover:bg-background transition-colors text-left"
                    >
                      <div
                        className="w-8 h-11 bg-muted rounded flex-shrink-0 bg-cover bg-center"
                        style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : "none" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.title || item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(item.release_date || item.first_air_date || "").substring(0, 4)} · {item.media_type === "movie" ? "Película" : "Serie"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center p-4">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <div
              className="w-10 h-14 rounded-lg bg-muted bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: pendingItem.poster_path ? `url(https://image.tmdb.org/t/p/w200${pendingItem.poster_path})` : "none" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{pendingItem.title || pendingItem.name}</p>
              <p className="text-xs text-muted-foreground">
                {(pendingItem.release_date || pendingItem.first_air_date || "").substring(0, 4)} · {pendingItem.media_type === "movie" ? "Película" : "Serie"}
              </p>
            </div>
            <button onClick={() => setPendingItem(null)} className="text-muted-foreground hover:text-white p-1 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Tu nombre o alias (opcional)"
            value={suggesterName}
            onChange={e => setSuggesterName(e.target.value)}
            maxLength={40}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-white placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSubmit}
            disabled={submitSuggestion.isPending}
            className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitSuggestion.isPending ? "Enviando..." : "Enviar sugerencia"}
          </button>
        </div>
      )}

      {/* Sugerencias aprobadas */}
      {!isLoadingApproved && approved && approved.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-2 mb-3 pr-4">
            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
              Las que ya subimos
            </p>
            <div className="flex gap-1">
              <button onClick={() => scroll("left")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => scroll("right")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x pr-4">
            {approved.map((item: SuggestionRow) => (
              <div
                key={item.id}
                className="min-w-[120px] w-[120px] flex flex-col gap-1 snap-start cursor-pointer group"
                onClick={() => setSelectedSuggestion(item)}
              >
                <div
                  className="w-full aspect-[2/3] rounded-lg bg-cover bg-center shadow-md border border-border group-hover:border-primary/50 transition-colors"
                  style={{ backgroundImage: `url(${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''})` }}
                />
                <div>
                  <h3 className="font-bold text-xs text-white line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                  {item.suggested_by && (
                    <p className="text-[10px] text-muted-foreground/50 truncate">por {item.suggested_by}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedSuggestion && (
        <SuggestionDetailPopup item={selectedSuggestion} onClose={() => setSelectedSuggestion(null)} />
      )}
    </section>
  );
}

// ─── Content Section ──────────────────────────────────────────────────────────

function ContentSection({
  title, items, isLoading, onSelect, showDate,
}: {
  title: string;
  items?: ContentRow[] | null;
  isLoading: boolean;
  onSelect: (item: ContentRow) => void;
  showDate?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <section className="py-6 px-4">
      <div className="flex justify-between items-center mb-4 pr-4">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll("left")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll("right")} className="p-1 rounded-full border border-border text-muted-foreground hover:text-white hover:border-white transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x pr-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="min-w-[140px] aspect-[2/3] rounded-lg bg-card snap-start" />
          ))
        ) : items && items.length > 0 ? (
          items.map(item => (
            <div
              key={item.id}
              className="min-w-[140px] w-[140px] flex flex-col gap-1 snap-start cursor-pointer group"
              onClick={() => onSelect(item)}
            >
              <div
                className="w-full aspect-[2/3] rounded-lg bg-cover bg-center shadow-md border border-border group-hover:border-primary/50 transition-colors"
                style={{ backgroundImage: `url(${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''})` }}
              />
              <div>
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                {item.personal_review && (
                  <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">"{item.personal_review}"</p>
                )}
                {showDate && item.release_date ? (
                  <p className="text-xs text-primary font-medium mt-0.5">{item.release_date}</p>
                ) : !item.personal_review && item.rating ? (
                  <div className="flex items-center text-xs text-primary font-medium mt-0.5">
                    <Star size={10} className="mr-1 fill-primary" /> {item.rating}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">No hay contenido disponible.</div>
        )}
      </div>
    </section>
  );
}
