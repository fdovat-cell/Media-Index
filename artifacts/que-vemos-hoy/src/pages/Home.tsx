import { useState } from "react";
import { PhoneLayout } from "@/components/layout/PhoneLayout";
import { useContent, useNotes } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRow, NoteRow } from "@/lib/database.types";
import { DetailPopup } from "@/components/DetailPopup";
import { Star, FileText } from "lucide-react";

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

        {/* WHATSAPP BUTTON */}
        <div className="flex justify-center py-6">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-white transition-colors opacity-50 hover:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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

function ContentSection({
  title, items, isLoading, onSelect, showDate,
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
