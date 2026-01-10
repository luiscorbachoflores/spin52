import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Star, Music, Trash2, Headphones, Calendar as CalendarIcon,
    CheckCircle2, Trophy, Heart, Clock, PlayCircle, LogOut, Disc, Filter, Loader2, Zap, Users, Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-slate-100 text-slate-500 border-slate-200',
        'Escuchando': 'bg-amber-100 text-amber-600 border-amber-200 animate-pulse',
        'Escuchado': 'bg-emerald-100 text-emerald-600 border-emerald-200'
    };
    const icons = {
        'Pendiente': <Clock size={12} />,
        'Escuchando': <PlayCircle size={12} />,
        'Escuchado': <CheckCircle2 size={12} />
    };

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[status]}`}>
            {icons[status]} {status}
        </span>
    );
};

// Helper for half-stars
const StarDisplay = ({ rating, size = 12 }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((index) => {
                const fillAmount = Math.max(0, Math.min(1, rating - (index - 1)));
                return (
                    <div key={index} className="relative">
                        <Star size={size} className="text-slate-200" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillAmount * 100}%` }}>
                            <Star size={size} className="text-amber-500 fill-amber-500" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Calendar Component ---
const CalendarView = ({ albums }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);

    // Get days in month
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

    // Filter albums listened in this month
    const monthAlbums = albums.filter(a => {
        if (!a.listened_at) return false;
        const d = new Date(a.listened_at);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // Map day -> albums
    const albumsByDay = {};
    monthAlbums.forEach(a => {
        const day = new Date(a.listened_at).getDate();
        if (!albumsByDay[day]) albumsByDay[day] = [];
        albumsByDay[day].push(a);
    });

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <CalendarIcon className="text-sky-500" />
                    {monthNames[month]} <span className="text-slate-300">{year}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full">←</button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 text-center mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 rounded-2xl"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const daysAlbums = albumsByDay[day] || [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                    return (
                        <div key={day} className={`aspect-square rounded-2xl border-2 relative overflow-hidden group transition-all ${isToday ? 'border-sky-500/50 bg-sky-50' : 'border-slate-100 bg-white hover:border-sky-200'
                            }`}>
                            <span className={`absolute top-2 left-2 text-[10px] font-black z-10 ${daysAlbums.length > 0 ? 'text-white drop-shadow-md' : 'text-slate-300'}`}>
                                {day}
                            </span>

                            {daysAlbums.length > 0 ? (
                                <div className="absolute inset-0 grid place-items-center">
                                    <img src={daysAlbums[0].cover} className="w-full h-full object-cover" alt="" title={daysAlbums[0].title} />
                                    {daysAlbums.length > 1 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs backdrop-blur-[2px]">
                                            +{daysAlbums.length - 1}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Disc size={16} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function Dashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('collection'); // 'collection', 'calendar', 'community'

    const [albums, setAlbums] = useState([]);
    const [communityAlbums, setCommunityAlbums] = useState([]);

    const [loading, setLoading] = useState(true);
    const [commLoading, setCommLoading] = useState(false);

    // Modal & Search
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [apiSearchQuery, setApiSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingApi, setSearchingApi] = useState(false);
    const [newAlbum, setNewAlbum] = useState({
        title: "", artist: "", cover: "", rating: 5, review: "", favorites: "", status: "Pendiente"
    });

    const fetchAlbums = async () => {
        try {
            const res = await api.get('/albums');
            setAlbums(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchCommunity = async () => {
        setCommLoading(true);
        try {
            const res = await api.get('/community-albums');
            setCommunityAlbums(res.data);
        } catch (error) { console.error(error); } finally { setCommLoading(false); }
    };

    useEffect(() => {
        fetchAlbums();
    }, []);

    useEffect(() => {
        if (activeTab === 'community' && communityAlbums.length === 0) {
            fetchCommunity();
        }
    }, [activeTab]);

    const completedCount = albums.filter(a => a.status === 'Escuchado').length;
    const listeningCount = albums.filter(a => a.status === 'Escuchando').length;
    const progress = (completedCount / 52) * 100;

    // Filters
    const getFilteredAlbums = (sourceList) => {
        return sourceList.filter(album => {
            const matchesSearch = album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                album.artist.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterStatus === "Todos" || album.status === filterStatus;
            return matchesSearch && matchesFilter;
        });
    };

    const displayedAlbums = activeTab === 'community' ? getFilteredAlbums(communityAlbums) : getFilteredAlbums(albums);

    // ... (Handlers kept same)
    const handleAddAlbum = async (e) => {
        e.preventDefault();
        try {
            await api.post('/albums', { ...newAlbum, favorites: newAlbum.favorites });
            await fetchAlbums();
            setIsModalOpen(false);
            setNewAlbum({ title: "", artist: "", cover: "", rating: 5, review: "", favorites: "", status: "Pendiente" });
            setApiSearchQuery(""); setSearchResults([]);
        } catch (error) { console.error(error); }
    };
    const updateStatus = async (id, newStatus) => {
        const oldAlbums = [...albums];
        setAlbums(albums.map(a => a.id === id ? { ...a, status: newStatus } : a));
        try { await api.put(`/albums/${id}`, { status: newStatus }); }
        catch (error) { setAlbums(oldAlbums); }
    };
    const deleteAlbum = async (id) => {
        if (!confirm("¿Seguro que quieres borrar?")) return;
        try { await api.delete(`/albums/${id}`); setAlbums(albums.filter(a => a.id !== id)); }
        catch (error) { console.error(error); }
    };
    const searchExternal = async () => { /* ... same ... */
        if (!apiSearchQuery) return;
        setSearchingApi(true);
        try {
            const res = await api.get(`/search?q=${encodeURIComponent(apiSearchQuery)}`);
            setSearchResults(res.data);
        } catch (err) { console.error(err); } finally { setSearchingApi(false); }
    };
    const selectSearchResult = (result) => { /* ... same ... */
        setNewAlbum({ ...newAlbum, title: result.title, artist: result.artist, cover: result.cover || "" });
        setSearchResults([]); setApiSearchQuery("");
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50"><Loader2 className="animate-spin text-sky-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
            <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6">
                        {/* Top Row: Logo + Mobile Logout */}
                        <div className="flex items-center justify-between md:justify-start w-full md:w-auto">
                            <div className="flex items-center gap-4">
                                <img src="/logo_new.png" className="w-12 h-12 object-contain" alt="Logo" />
                                <div>
                                    <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                                        <span className="text-white">Spin</span><span className="text-sky-500">52</span>
                                    </h1>
                                </div>
                            </div>
                            {/* Mobile Logout (Visible only on small screens) */}
                            <button onClick={onLogout} className="md:hidden text-slate-500 hover:text-red-500 p-2">
                                <LogOut size={20} />
                            </button>
                        </div>

                        {/* Navigation Tabs (Centered on Desktop, Full/Centered on Mobile) */}
                        <div className="flex bg-slate-800/50 p-1 rounded-full overflow-hidden mx-auto md:mx-0">
                            {[
                                { id: 'collection', label: 'Mi Colección', icon: Disc },
                                { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
                                { id: 'community', label: 'Comunidad', icon: Globe },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 sm:px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id
                                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Desktop Logout (Hidden on mobile) */}
                        <div className="hidden md:flex items-center gap-3">
                            <button onClick={onLogout} className="text-slate-500 hover:text-red-500 p-2"><LogOut size={20} /></button>
                        </div>
                    </div>

                    {/* Stats (Hide in Calendar/Community for cleanliness? Or keep? User said "Tabs... don't change anything else". Keeping stats is safer for "Context") */}
                    {activeTab === 'collection' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-2 bg-slate-800 rounded-xl p-4 border border-slate-700/50 flex items-center relative overflow-hidden">
                                <Trophy size={60} className="absolute right-0 top-0 opacity-5 text-sky-500" />
                                <div className="relative z-10 w-full">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                        <span className="text-sky-500">Progreso</span>
                                        <span className="text-slate-400">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                                <Disc className="text-orange-500" size={24} />
                                <div><div className="text-2xl font-black leading-none">{listeningCount}</div><div className="text-[9px] text-slate-400 uppercase font-black">Escuchando</div></div>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                                <CalendarIcon className="text-slate-500" size={24} />
                                <div><div className="text-2xl font-black leading-none">{albums.filter(a => a.status === 'Pendiente').length}</div><div className="text-[9px] text-slate-400 uppercase font-black">Pendientes</div></div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 mt-8">
                {activeTab === 'calendar' ? (
                    <CalendarView albums={albums} />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            {/* Search / Filter Bar */}
                            <div className="flex gap-2 flex-1 max-w-xl">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input type="text" placeholder="Buscar..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"
                                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-4 text-xs font-black uppercase outline-none"
                                >
                                    <option>Todos</option>
                                    <option>Escuchado</option>
                                    <option>Escuchando</option>
                                    <option>Pendiente</option>
                                </select>
                            </div>

                            {activeTab === 'collection' && (
                                <button onClick={() => setIsModalOpen(true)} className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20">
                                    <Plus size={18} /> Añadir
                                </button>
                            )}
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mb-20">
                            {displayedAlbums.map((album) => (
                                <div key={album.id} onClick={() => navigate(`/album/${album.id}`)}
                                    className="bg-white rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer ring-1 ring-slate-100 group hover:-translate-y-2"
                                >
                                    <div className="relative aspect-square overflow-hidden bg-slate-900">
                                        <img src={album.cover} alt={album.title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${album.status === 'Pendiente' ? 'grayscale opacity-60' : ''}`}
                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" }}
                                        />
                                        <div className="absolute top-4 left-4"><StatusBadge status={album.status} /></div>

                                        {/* Community Owner Badge */}
                                        {activeTab === 'community' && album.username && (
                                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ring-1 ring-white/20">
                                                <Users size={12} className="text-sky-400" /> {album.username}
                                            </div>
                                        )}

                                        {/* Actions only for own collection */}
                                        {activeTab === 'collection' && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <div className="flex justify-end mb-auto"><button onClick={(e) => { e.stopPropagation(); deleteAlbum(album.id); }} className="bg-red-500 p-2 rounded-full text-white"><Trash2 size={16} /></button></div>
                                                <div className="flex gap-2">
                                                    {['Pendiente', 'Escuchando', 'Escuchado'].map((s) => (
                                                        <button key={s} onClick={(e) => { e.stopPropagation(); updateStatus(album.id, s); }} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg ${album.status === s ? 'bg-sky-500 text-white' : 'bg-slate-800 text-zinc-400'}`}>{s.slice(0, 4)}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-black text-slate-900 line-clamp-1">{album.title}</h3>
                                        <p className="text-xs text-sky-600 font-bold uppercase truncate">{album.artist}</p>

                                        {album.status === 'Escuchado' && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                                <StarDisplay rating={album.rating} size={10} />
                                                {album.favorites && <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Top</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Modal Logic (Same as before, hidden if activeTab !== collection basically via button visibility) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-slate-900 p-8">
                            <h2 className="text-3xl font-black text-white italic"><span className="text-sky-500">Añadir</span> Álbum</h2>
                            <div className="flex gap-2 mt-4">
                                <input className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white font-bold" placeholder="Buscar..." value={apiSearchQuery} onChange={e => setApiSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchExternal()} />
                                <button onClick={searchExternal} className="bg-sky-500 text-white p-3 rounded-xl">{searchingApi ? <Loader2 className="animate-spin" /> : <Search />}</button>
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-white rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                    {searchResults.map((r, i) => (
                                        <div key={i} onClick={() => selectSearchResult(r)} className="p-3 hover:bg-slate-100 cursor-pointer flex gap-3 text-sm font-bold border-b">
                                            <img src={r.cover} className="w-8 h-8 rounded bg-slate-200" alt="" /> {r.title} - <span className="text-slate-500">{r.artist}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleAddAlbum} className="p-8 space-y-4">
                            <input className="w-full bg-slate-50 p-3 rounded-xl font-bold" placeholder="Título" required value={newAlbum.title} onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })} />
                            <input className="w-full bg-slate-50 p-3 rounded-xl font-bold" placeholder="Artista" required value={newAlbum.artist} onChange={e => setNewAlbum({ ...newAlbum, artist: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <select className="bg-slate-50 p-3 rounded-xl font-bold" value={newAlbum.status} onChange={e => setNewAlbum({ ...newAlbum, status: e.target.value })}>
                                    <option value="Pendiente">Pendiente</option><option value="Escuchando">Escuchando</option><option value="Escuchado">Escuchado</option>
                                </select>
                                <input className="bg-slate-50 p-3 rounded-xl font-bold" placeholder="URL Portada" value={newAlbum.cover} onChange={e => setNewAlbum({ ...newAlbum, cover: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-black text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] bg-sky-500 text-white py-3 rounded-xl font-black text-xs uppercase">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
