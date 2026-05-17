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
      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar relative">
        {/* HERO SECTION */}
        <section className="relative w-full aspect-[4/5] bg-black">
          {isHeroLoading ? (
            <Skeleton className="w-full h-full bg-card" />
          ) : heroContent && heroContent.length > 0 ? (
            <div className="w-full h-full relative cursor-pointer" onClick={() => setSelectedItem(heroContent[0])}>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${heroContent[0].poster_path ? `https://image.tmdb.org/t/p/w500${heroContent[0].poster_path}` : ''})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              
              <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">{heroContent[0].title}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-300 font-medium mt-1">
                    {heroContent[0].release_date && <span>{heroContent[0].release_date.substring(0,4)}</span>}
                    {heroContent[0].rating && (
                      <span className="flex items-center text-primary">
                        <Star size={14} className="mr-1 fill-primary" /> {heroContent[0].rating}
                      </span>
                    )}
                  </div>
                </div>
                
                {heroContent[0].personal_review && (
                  <p className="text-gray-200 text-sm italic border-l-2 border-primary pl-3">
                    "{heroContent[0].personal_review}"
                  </p>
                )}
                
                <button className="bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-md w-full mt-2 hover:opacity-90 transition-opacity">
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
          <div className="flex justify-between items-center mb-4">
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
        <section className="py-6 px-4 mb-8">
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4">Próximos estrenos</h2>
          <div className="flex flex-col gap-3">
            {isUpcomingLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-[80px] rounded-lg bg-card" />
              ))
            ) : upcomingContent && upcomingContent.length > 0 ? (
              upcomingContent.map(item => (
                <div 
                  key={item.id} 
                  className="flex gap-3 bg-card rounded-lg p-2 border border-card-border cursor-pointer group hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedItem(item)}
                >
                  <div 
                    className="w-16 h-20 rounded bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''})` }}
                  />
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-primary font-medium mt-1">{item.release_date}</p>
                    {item.platforms && item.platforms.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{item.platforms.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic">No hay próximos estrenos.</div>
            )}
          </div>
        </section>

        {selectedItem && (
          <DetailPopup item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
      
      {/* BOTTOM NAV */}
      <nav className="absolute bottom-0 w-full max-w-[430px] bg-background/95 backdrop-blur-md border-t border-border flex justify-around items-center h-16 px-4 z-40">
        <NavItem label="Hoy" active />
        <NavItem label="Estrenos" />
        <NavItem label="Imperdibles" />
        <NavItem label="Notas" />
      </nav>
    </PhoneLayout>
  );
}

function ContentSection({ title, items, isLoading, onSelect }: { title: string, items?: ContentRow[] | null, isLoading: boolean, onSelect: (item: ContentRow) => void }) {
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
              className="min-w-[140px] w-[140px] flex flex-col gap-2 snap-start cursor-pointer group"
              onClick={() => onSelect(item)}
            >
              <div 
                className="w-full aspect-[2/3] rounded-lg bg-cover bg-center shadow-md border border-border group-hover:border-primary/50 transition-colors"
                style={{ backgroundImage: `url(${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''})` }}
              />
              <div>
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                {item.rating && (
                  <div className="flex items-center text-xs text-primary font-medium mt-0.5">
                    <Star size={10} className="mr-1 fill-primary" /> {item.rating}
                  </div>
                )}
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

function NavItem({ label, active }: { label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 w-full h-full ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}