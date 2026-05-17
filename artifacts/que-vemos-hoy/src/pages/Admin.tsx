import { useState } from "react";
import { PhoneLayout } from "@/components/layout/PhoneLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAllContent, useNotes } from "@/hooks/use-data";
import { useMutateContent, useTmdbSearch, useMutateNotes } from "@/hooks/use-admin";
import { Trash, LogOut, Plus, Search } from "lucide-react";

export default function Admin() {
  const { session, isLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
  };

  if (isLoading) return <PhoneLayout><div className="flex-1 flex items-center justify-center">Cargando...</div></PhoneLayout>;

  if (!session) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 relative">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Qué Vemos Hoy</h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Admin</p>
          </div>
          
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            {loginError && <div className="text-destructive text-sm text-center">{loginError}</div>}
            
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-card border border-border p-3 rounded-md focus:outline-none focus:border-primary text-white"
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-card border border-border p-3 rounded-md focus:outline-none focus:border-primary text-white"
              required
            />
            <button type="submit" className="bg-primary text-primary-foreground font-bold py-3 rounded-md hover:opacity-90">
              Ingresar
            </button>
          </form>
        </div>
      </PhoneLayout>
    );
  }

  return (
    <PhoneLayout>
      <div className="flex flex-col h-full bg-background">
        <header className="p-4 border-b border-border flex justify-between items-center bg-card">
          <h1 className="font-bold text-lg">Admin Panel</h1>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-muted-foreground hover:text-white">
            <LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-8 no-scrollbar">
          <AdminContent />
        </div>
      </div>
    </PhoneLayout>
  );
}

function AdminContent() {
  const { data: content } = useAllContent();
  const { data: notes } = useNotes(true);
  const { deleteContent, addContent } = useMutateContent();
  const { deleteNote } = useMutateNotes();

  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearching } = useTmdbSearch(searchQuery);
  const [selectedSection, setSelectedSection] = useState("weekly");

  // Mini-form state for adding with review
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [pendingReview, setPendingReview] = useState("");
  const [pendingPlatforms, setPendingPlatforms] = useState("");

  const handleSelectItem = (item: any) => {
    setPendingItem(item);
    setPendingReview("");
    setPendingPlatforms("");
    setSearchQuery("");
  };

  const handleConfirmAdd = () => {
    if (!pendingItem) return;
    addContent.mutate({
      tmdb_id: pendingItem.id,
      media_type: pendingItem.media_type,
      section: selectedSection as any,
      title: pendingItem.original_title || pendingItem.original_name || pendingItem.title || pendingItem.name,
      original_title: pendingItem.original_title || pendingItem.original_name,
      overview: pendingItem.overview,
      poster_path: pendingItem.poster_path,
      backdrop_path: pendingItem.backdrop_path,
      release_date: pendingItem.release_date || pendingItem.first_air_date,
      rating: pendingItem.vote_average,
      vote_count: pendingItem.vote_count,
      platforms: pendingPlatforms ? pendingPlatforms.split(",").map(p => p.trim()).filter(Boolean) : [],
      personal_review: pendingReview.trim(),
      visible: true,
      display_order: 0
    });
    setPendingItem(null);
    setPendingReview("");
    setPendingPlatforms("");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* TMDB Search */}
      <section className="bg-card p-4 rounded-lg border border-border">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Agregar Contenido</h2>
        <div className="flex gap-2 mb-4">
          <select 
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="bg-background border border-border rounded px-2 py-2 text-sm focus:outline-none"
          >
            <option value="hero">Hero</option>
            <option value="weekly">Lo Mejor Esta Semana</option>
            <option value="classic">Imperdibles</option>
            <option value="upcoming">Próximos Estrenos</option>
          </select>
        </div>

        {/* Pending item — review form */}
        {pendingItem && (
          <div className="mb-4 p-3 bg-background border border-primary/50 rounded-lg flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <div 
                className="w-10 h-14 bg-muted rounded bg-cover flex-shrink-0"
                style={{ backgroundImage: pendingItem.poster_path ? `url(https://image.tmdb.org/t/p/w200${pendingItem.poster_path})` : 'none' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">
                  {pendingItem.original_title || pendingItem.original_name || pendingItem.title || pendingItem.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{pendingItem.media_type} • {(pendingItem.release_date || pendingItem.first_air_date || "").substring(0,4)}</p>
              </div>
            </div>
            <textarea
              placeholder="Tu reseña o comentario personal (opcional)..."
              value={pendingReview}
              onChange={e => setPendingReview(e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded p-2 focus:outline-none focus:border-primary text-sm text-white resize-none"
            />
            <input
              type="text"
              placeholder="Plataforma (ej: Netflix, HBO, Disney+)"
              value={pendingPlatforms}
              onChange={e => setPendingPlatforms(e.target.value)}
              className="w-full bg-card border border-border rounded p-2 focus:outline-none focus:border-primary text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAdd}
                className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-md text-sm hover:opacity-90"
              >
                Guardar
              </button>
              <button
                onClick={() => setPendingItem(null)}
                className="px-4 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar película o serie..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded p-2 pl-9 focus:outline-none focus:border-primary text-sm"
          />
        </div>

        {searchQuery.length >= 3 && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {isSearching ? (
              <div className="text-xs text-center text-muted-foreground p-2">Buscando...</div>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((item: any) => (
                <div key={item.id} className="flex gap-3 p-2 bg-background rounded items-center border border-border">
                  <div 
                    className="w-10 h-14 bg-muted rounded bg-cover flex-shrink-0"
                    style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {item.original_title || item.original_name || item.title || item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{(item.release_date || item.first_air_date || "").substring(0,4)} • {item.media_type}</p>
                  </div>
                  <button 
                    onClick={() => handleSelectItem(item)}
                    className="p-2 bg-primary/20 text-primary rounded-md hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-center text-muted-foreground p-2">Sin resultados</div>
            )}
          </div>
        )}
      </section>

      {/* Content List */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Contenido Actual</h2>
        <div className="flex flex-col gap-2">
          {content?.map(item => (
            <div key={item.id} className="flex gap-3 p-3 bg-card rounded-lg border border-border items-center">
              <div 
                className="w-12 h-16 bg-muted rounded bg-cover flex-shrink-0"
                style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : 'none' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary uppercase tracking-wider">{item.section}</span>
                  <span>{item.visible ? 'Visible' : 'Oculto'}</span>
                </p>
              </div>
              <button 
                onClick={() => deleteContent.mutate(item.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notes List */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">Notas Actuales</h2>
        <div className="flex flex-col gap-2">
          {notes?.map(item => (
            <div key={item.id} className="flex gap-3 p-3 bg-card rounded-lg border border-border items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.excerpt}</p>
              </div>
              <button 
                onClick={() => deleteNote.mutate(item.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}