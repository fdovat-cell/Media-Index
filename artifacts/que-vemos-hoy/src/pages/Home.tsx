import { useState } from "react";
import { PhoneLayout } from "@/components/layout/PhoneLayout";
import { useContent, useNotes } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRow, NoteRow } from "@/lib/database.types";
import { DetailPopup } from "@/components/DetailPopup";
import { Star, FileText } from "lucide-react";

export default function Home() {
  const { data: heroContent, isLoading: isHeroLoading } = useContent("hero");
  const { data: weeklyContent, isLoading: isWeeklyLoading } = useContent("weekly");
  const { data: classicContent, isLoading: isClassicLoading } = useContent("classic");
  const { data: upcomingContent, isLoading: isUpcomingLoading } = useContent("upcoming");
  const { data: notesContent, isLoading: isNotesLoading } = useNotes();

  const [selectedItem, setSelectedItem] = useState<ContentRow | NoteRow | null>(null);

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
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

              <div className="absolute top-3 left-4">
                <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Recomendación del día</span>
              </div>

              <div className="absolute bottom-0 left-0 w-full px-4 pb-4 flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">
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
                  <p className="text-gray-300 text-xs italic border-l-2 border-primary pl-3 line-clamp-2">
                    "{heroContent[0].personal_review}"
                  </p>
                )}

                <button className="bg-primary text-primary-foreground font-semibold py-2.5 px-4 rounded-md w-full mt-1 hover:opacity-90 transition-opacity text-sm">
                  Ver reseña completa
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* LO MEJOR ESTA SEMANA */}
        <ContentSection
          title="Lo mejor esta semana"
          items={weeklyContent}
          isLoading={isWeeklyLoading}
          onSelect={setSelectedItem}
        />

        {/* IMPERDIBLES */}
        <ContentSection
          title="Imperdibles"
          items={classicContent}
          isLoading={isClassicLoading}
          onSelect={setSelectedItem}
        />

        {/* QUÉ LEEMOS HOY */}
        <section className="py-6 px-4">
          <div className="flex justify-between items-center mb-4 pr-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Qué leemos hoy</h2>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
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
          items={upcomingContent}
          isLoading={isUpcomingLoading}
          onSelect={setSelectedItem}
          showDate
        />

        {selectedItem && (
          <DetailPopup item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </PhoneLayout>
  );
}

function ContentSection({
  title,
  items,
  isLoading,
  onSelect,
  showDate,
}: {
  title: string;
  items?: ContentRow[] | null;
  isLoading: boolean;
  onSelect: (item: ContentRow) => void;
  showDate?: boolean;
}) {
  return (
    <section className="py-6 pl-4">
      <div className="flex justify-between items-center mb-4 pr-4">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{title}</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x pr-4">
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
                {/* Reseña personal sutil debajo del título */}
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
