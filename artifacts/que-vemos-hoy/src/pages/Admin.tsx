import { useState } from "react";
import { PhoneLayout } from "@/components/layout/PhoneLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAllContent, useNotes } from "@/hooks/use-data";
import { useMutateContent, useTmdbSearch, useMutateNotes, useSyncFromTmdb } from "@/hooks/use-admin";
import { Trash, LogOut, Plus, Search, RefreshCw, ImageIcon, GripVertical, Pencil, Check } from "lucide-react";
import { ContentRow, NoteRow } from "@/lib/database.types";

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

  if (isLoading) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Cargando...</div>
      </PhoneLayout>
    );
  }

  if (!session) {
    return (
      <PhoneLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
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
        <div className="bg-card border-b border-border px-4 pt-10 pb-4 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-primary uppercase tracking-widest font-bold">Qué Vemos Hoy</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Panel de Admin</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white pb-1"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <AdminContent />
        </div>
      </div>
    </PhoneLayout>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">{children}</h2>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border border-border rounded-xl p-4">{children}</div>;
}

// ── Drag to reorder helpers ───────────────────────────────────────────────────

function useDragReorder<T extends { id: string; display_order: number }>(
  items: T[],
  onSaveOrder: (ordered: T[]) => void
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [list, setList] = useState<T[]>([]);
  const [dirty, setDirty] = useState(false);

  const activeList = dirty ? list : items;

  const onDragStart = (id: string) => {
    setDragId(id);
    if (!dirty) setList(items);
  };

  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setList(prev => {
      const src = prev.findIndex(i => i.id === dragId);
      const dst = prev.findIndex(i => i.id === overId);
      if (src === -1 || dst === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      next.splice(dst, 0, moved);
      return next;
    });
    setDirty(true);
  };

  const onDragEnd = () => setDragId(null);

  const saveOrder = () => {
    onSaveOrder(activeList);
    setDirty(false);
  };

  return { activeList, dirty, onDragStart, onDragOver, onDragEnd, saveOrder };
}

// ── Inline editor for content items ──────────────────────────────────────────

function ContentItemEditor({
  item,
  onSave,
  onCancel,
  isSaving,
}: {
  item: ContentRow;
  onSave: (updates: Partial<ContentRow>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(item.title);
  const [review, setReview] = useState(item.personal_review ?? "");
  const [platforms, setPlatforms] = useState((item.platforms ?? []).join(", "));
  const [section, setSection] = useState(item.section);
  const [visible, setVisible] = useState(item.visible);

  const handleSave = () => {
    onSave({
      title: title.trim() || item.title,
      personal_review: review.trim() || null,
      platforms: platforms ? platforms.split(",").map(p => p.trim()).filter(Boolean) : [],
      section: section as any,
      visible,
    });
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
      />
      <textarea
        value={review}
        onChange={e => setReview(e.target.value)}
        placeholder="Reseña personal (opcional)..."
        rows={3}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
      />
      <input
        type="text"
        value={platforms}
        onChange={e => setPlatforms(e.target.value)}
        placeholder="Plataforma (ej: Netflix, HBO)"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
      <select
        value={section}
        onChange={e => setSection(e.target.value as any)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      >
        <option value="hero">Hero (destacado principal)</option>
        <option value="weekly">Lo mejor esta semana</option>
        <option value="classic">Imperdibles</option>
        <option value="upcoming">Próximos estrenos</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} className="accent-primary w-4 h-4" />
        Visible para los visitantes
      </label>
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          <Check size={14} /> {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-white">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Inline editor for notes ───────────────────────────────────────────────────

function NoteItemEditor({
  item,
  onSave,
  onCancel,
  isSaving,
}: {
  item: NoteRow;
  onSave: (updates: Partial<NoteRow>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [excerpt, setExcerpt] = useState(item.excerpt ?? "");
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  const [visible, setVisible] = useState(item.visible);

  const handleSave = () => {
    onSave({
      title: title.trim() || item.title,
      body: body.trim() || item.body,
      excerpt: excerpt.trim() || null,
      image_url: imageUrl.trim() || null,
      visible,
    });
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Texto completo..."
        rows={5}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
      />
      <input
        type="text"
        value={excerpt}
        onChange={e => setExcerpt(e.target.value)}
        placeholder="Resumen corto (aparece en la tarjeta)"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
      <div className="relative">
        <ImageIcon size={14} className="absolute left-3 top-3 text-muted-foreground" />
        <input
          type="url"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="URL de imagen de portada"
          className="w-full bg-background border border-border rounded-lg px-3 py-2 pl-9 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      {imageUrl && <div className="w-full h-24 rounded-lg bg-cover bg-center border border-border" style={{ backgroundImage: `url(${imageUrl})` }} />}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} className="accent-primary w-4 h-4" />
        Visible para los visitantes
      </label>
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          <Check size={14} /> {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-white">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AdminContent() {
  const { data: content } = useAllContent();
  const { data: notes } = useNotes(true);
  const { deleteContent, addContent, updateContent } = useMutateContent();
  const { addNote, deleteNote, updateNote } = useMutateNotes();
  const { syncTrending, syncUpcoming } = useSyncFromTmdb();

  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearching } = useTmdbSearch(searchQuery);
  const [selectedSection, setSelectedSection] = useState("weekly");
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [pendingReview, setPendingReview] = useState("");
  const [pendingPlatforms, setPendingPlatforms] = useState("");

  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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
      title: pendingItem.title || pendingItem.name,
      original_title: pendingItem.original_title || pendingItem.original_name || null,
      overview: pendingItem.overview || null,
      poster_path: pendingItem.poster_path || null,
      backdrop_path: pendingItem.backdrop_path || null,
      release_date: pendingItem.release_date || pendingItem.first_air_date || null,
      rating: pendingItem.vote_average ?? null,
      vote_count: pendingItem.vote_count ?? null,
      platforms: pendingPlatforms ? pendingPlatforms.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
      personal_review: pendingReview.trim() || null,
      visible: true,
      display_order: 0
    });
    setPendingItem(null);
  };

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteExcerpt, setNoteExcerpt] = useState("");
  const [noteImageUrl, setNoteImageUrl] = useState("");
  const [noteVisible, setNoteVisible] = useState(true);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) return;
    addNote.mutate(
      { title: noteTitle.trim(), body: noteBody.trim(), excerpt: noteExcerpt.trim() || null, image_url: noteImageUrl.trim() || null, visible: noteVisible, display_order: 0 },
      { onSuccess: () => { setNoteTitle(""); setNoteBody(""); setNoteExcerpt(""); setNoteImageUrl(""); setNoteVisible(true); } }
    );
  };

  const contentDrag = useDragReorder(content ?? [], (ordered) => {
    ordered.forEach((item, idx) => {
      if (item.display_order !== idx) {
        updateContent.mutate({ id: item.id, updates: { display_order: idx } });
      }
    });
  });

  const notesDrag = useDragReorder(notes ?? [], (ordered) => {
    ordered.forEach((item, idx) => {
      if (item.display_order !== idx) {
        updateNote.mutate({ id: item.id, updates: { display_order: idx } });
      }
    });
  });

  const weeklyCount = content?.filter(c => c.section === "weekly").length ?? 0;
  const upcomingCount = content?.filter(c => c.section === "upcoming").length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-4 pb-12">

      {/* ── 1. SYNC ───────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Actualizar desde TMDB</SectionLabel>
        <Card>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Trae automáticamente lo que está de moda esta semana y los próximos estrenos.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Lo mejor esta semana</p>
                <p className="text-xs text-muted-foreground">{weeklyCount} títulos guardados</p>
              </div>
              <button
                onClick={() => syncTrending.mutate()}
                disabled={syncTrending.isPending}
                className="flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={syncTrending.isPending ? "animate-spin" : ""} />
                {syncTrending.isPending ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Próximos estrenos</p>
                <p className="text-xs text-muted-foreground">{upcomingCount} estrenos guardados</p>
              </div>
              <button
                onClick={() => syncUpcoming.mutate()}
                disabled={syncUpcoming.isPending}
                className="flex items-center gap-1.5 bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={syncUpcoming.isPending ? "animate-spin" : ""} />
                {syncUpcoming.isPending ? "Sincronizando..." : "Sincronizar"}
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* ── 2. AGREGAR MANUAL ────────────────────────────────────── */}
      <section>
        <SectionLabel>Agregar película o serie</SectionLabel>
        <Card>
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mb-3"
          >
            <option value="hero">Hero (destacado principal)</option>
            <option value="weekly">Lo mejor esta semana</option>
            <option value="classic">Imperdibles</option>
            <option value="upcoming">Próximos estrenos</option>
          </select>

          {pendingItem && (
            <div className="mb-3 p-3 bg-background border border-primary/50 rounded-lg flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-14 bg-muted rounded bg-cover flex-shrink-0" style={{ backgroundImage: pendingItem.poster_path ? `url(https://image.tmdb.org/t/p/w200${pendingItem.poster_path})` : "none" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{pendingItem.title || pendingItem.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{pendingItem.media_type} · {(pendingItem.release_date || pendingItem.first_air_date || "").substring(0, 4)}</p>
                </div>
              </div>
              <textarea placeholder="Tu reseña o comentario personal (opcional)..." value={pendingReview} onChange={e => setPendingReview(e.target.value)} rows={3} className="w-full bg-card border border-border rounded-lg p-2 focus:outline-none focus:border-primary text-sm text-white resize-none" />
              <input type="text" placeholder="Plataforma (ej: Netflix, HBO, Disney+)" value={pendingPlatforms} onChange={e => setPendingPlatforms(e.target.value)} className="w-full bg-card border border-border rounded-lg p-2 focus:outline-none focus:border-primary text-sm" />
              <div className="flex gap-2">
                <button onClick={handleConfirmAdd} className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-lg text-sm hover:opacity-90">Guardar</button>
                <button onClick={() => setPendingItem(null)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-white">Cancelar</button>
              </div>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input type="text" placeholder="Buscar película o serie..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2 pl-9 focus:outline-none focus:border-primary text-sm" />
          </div>

          {searchQuery.length >= 3 && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto no-scrollbar">
              {isSearching ? (
                <p className="text-xs text-center text-muted-foreground p-2">Buscando...</p>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((item: any) => (
                  <div key={item.id} className="flex gap-3 p-2 bg-background rounded-lg items-center border border-border">
                    <div className="w-9 h-12 bg-muted rounded bg-cover flex-shrink-0" style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : "none" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-white">{item.title || item.name}</p>
                      <p className="text-xs text-muted-foreground">{(item.release_date || item.first_air_date || "").substring(0, 4)} · {item.media_type}</p>
                    </div>
                    <button onClick={() => handleSelectItem(item)} className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground">
                      <Plus size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-muted-foreground p-2">Sin resultados</p>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* ── 3. AGREGAR NOTA ──────────────────────────────────────── */}
      <section>
        <SectionLabel>Agregar nota / lectura</SectionLabel>
        <Card>
          <form onSubmit={handleAddNote} className="flex flex-col gap-3">
            <input type="text" placeholder="Título *" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} required className="w-full bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-primary text-sm text-white" />
            <textarea placeholder="Texto completo *" value={noteBody} onChange={e => setNoteBody(e.target.value)} required rows={5} className="w-full bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-primary text-sm text-white resize-none" />
            <input type="text" placeholder="Resumen corto (aparece en la tarjeta)" value={noteExcerpt} onChange={e => setNoteExcerpt(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-primary text-sm" />
            <div className="relative">
              <ImageIcon size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input type="url" placeholder="URL de imagen de portada (opcional)" value={noteImageUrl} onChange={e => setNoteImageUrl(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5 pl-9 focus:outline-none focus:border-primary text-sm" />
            </div>
            {noteImageUrl && <div className="w-full h-28 rounded-lg bg-cover bg-center border border-border" style={{ backgroundImage: `url(${noteImageUrl})` }} />}
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={noteVisible} onChange={e => setNoteVisible(e.target.checked)} className="accent-primary w-4 h-4" />
              Visible para los visitantes
            </label>
            <button type="submit" disabled={addNote.isPending || !noteTitle.trim() || !noteBody.trim()} className="bg-primary text-primary-foreground font-bold py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
              {addNote.isPending ? "Publicando..." : "Publicar nota"}
            </button>
          </form>
        </Card>
      </section>

      {/* ── 4. CONTENIDO — DRAG TO REORDER + EDIT ────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Contenido guardado ({content?.length ?? 0})</SectionLabel>
          {contentDrag.dirty && (
            <button onClick={contentDrag.saveOrder} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
              Guardar orden
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {contentDrag.activeList.length > 0 ? contentDrag.activeList.map((item: ContentRow) => (
            <div
              key={item.id}
              draggable={editingContentId !== item.id}
              onDragStart={() => editingContentId !== item.id && contentDrag.onDragStart(item.id)}
              onDragOver={e => contentDrag.onDragOver(e, item.id)}
              onDragEnd={contentDrag.onDragEnd}
              className="flex flex-col p-3 bg-card rounded-xl border border-border"
            >
              <div className="flex gap-3 items-center">
                <GripVertical size={16} className="text-muted-foreground flex-shrink-0 opacity-40" />
                <div className="w-11 h-14 bg-muted rounded-lg bg-cover flex-shrink-0" style={{ backgroundImage: item.poster_path ? `url(https://image.tmdb.org/t/p/w200${item.poster_path})` : "none" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary uppercase tracking-wider">{item.section}</span>
                    {item.platforms && item.platforms.length > 0 && ` · ${item.platforms.join(", ")}`}
                  </p>
                  {item.personal_review && <p className="text-[11px] text-gray-500 italic truncate mt-0.5">"{item.personal_review}"</p>}
                  {!item.visible && <p className="text-[10px] text-amber-500 mt-0.5">Oculto</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingContentId(editingContentId === item.id ? null : item.id)}
                    className={`p-2 rounded-lg transition-colors ${editingContentId === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteContent.mutate(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                    <Trash size={15} />
                  </button>
                </div>
              </div>
              {editingContentId === item.id && (
                <ContentItemEditor
                  item={item}
                  isSaving={updateContent.isPending}
                  onSave={(updates) => updateContent.mutate({ id: item.id, updates }, { onSuccess: () => setEditingContentId(null) })}
                  onCancel={() => setEditingContentId(null)}
                />
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic px-1">Sin contenido todavía.</p>
          )}
        </div>
      </section>

      {/* ── 5. NOTAS — DRAG TO REORDER + EDIT ───────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Notas publicadas ({notes?.length ?? 0})</SectionLabel>
          {notesDrag.dirty && (
            <button onClick={notesDrag.saveOrder} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
              Guardar orden
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {notesDrag.activeList.length > 0 ? notesDrag.activeList.map((item: NoteRow) => (
            <div
              key={item.id}
              draggable={editingNoteId !== item.id}
              onDragStart={() => editingNoteId !== item.id && notesDrag.onDragStart(item.id)}
              onDragOver={e => notesDrag.onDragOver(e, item.id)}
              onDragEnd={notesDrag.onDragEnd}
              className="flex flex-col p-3 bg-card rounded-xl border border-border"
            >
              <div className="flex gap-3 items-center">
                <GripVertical size={16} className="text-muted-foreground flex-shrink-0 opacity-40" />
                {item.image_url ? (
                  <div className="w-11 h-11 bg-muted rounded-lg bg-cover flex-shrink-0" style={{ backgroundImage: `url(${item.image_url})` }} />
                ) : (
                  <div className="w-11 h-11 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={18} className="text-muted-foreground opacity-40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.excerpt || item.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.visible ? "Visible" : "Oculta"}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)}
                    className={`p-2 rounded-lg transition-colors ${editingNoteId === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteNote.mutate(item.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0">
                    <Trash size={15} />
                  </button>
                </div>
              </div>
              {editingNoteId === item.id && (
                <NoteItemEditor
                  item={item}
                  isSaving={updateNote.isPending}
                  onSave={(updates) => updateNote.mutate({ id: item.id, updates }, { onSuccess: () => setEditingNoteId(null) })}
                  onCancel={() => setEditingNoteId(null)}
                />
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic px-1">Sin notas todavía.</p>
          )}
        </div>
      </section>

    </div>
  );
}
