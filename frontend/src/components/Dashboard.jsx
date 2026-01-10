import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar as CalendarIcon, CheckCircle2, Clock, PlayCircle,
    LogOut, Disc, Loader2, MessageSquare, ArrowUpDown, ExternalLink, Menu, X,
    Library, LayoutGrid, Newspaper
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-border-dark text-slate-400 border-border-dark',
        'Escuchando': 'bg-primary/20 text-primary border-primary/20 animate-pulse',
        'Escuchado': 'bg-green-500/20 text-green-500 border-green-500/20'
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
const StarDisplay = ({ rating }) => {
    return (
        <div className="w-24 h-1.5 bg-border-dark rounded-full overflow-hidden">
            <div className="h-full bg-primary shadow-[0_0_10px_rgba(19,91,236,0.5)]" style={{ width: `${(rating / 5) * 100}%` }} />
        </div>
    );
};

// --- Calendar Component ---
const CalendarView = ({ albums }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDay, setSelectedDay] = useState(null);

    // Get days in month
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday

    // Map day -> albums (support multiple dates per album)
    const albumsByDay = {};
    albums.forEach(album => {
        if (album.listening_dates) {
            album.listening_dates.forEach(dateStr => {
                const d = new Date(dateStr);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const day = d.getDate();
                    if (!albumsByDay[day]) albumsByDay[day] = [];
                    // Avoid duplicates if data is messy, though Set inside map is better
                    if (!albumsByDay[day].find(a => a.id === album.id)) {
                        albumsByDay[day].push(album);
                    }
                }
            });
        } else if (album.listened_at) {
            // Fallback for old data not yet migrated or if backend send it
            const d = new Date(album.listened_at);
            if (d.getMonth() === month && d.getFullYear() === year) {
                const day = d.getDate();
                if (!albumsByDay[day]) albumsByDay[day] = [];
                if (!albumsByDay[day].find(a => a.id === album.id)) albumsByDay[day].push(album);
            }
        }
    });

    const changeMonth = (delta) => {
        setCurrentDate(new Date(year, month + delta, 1));
        setSelectedDay(null);
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="bg-surface-dark rounded-xl p-8 border border-border-dark shadow-sm relative">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <CalendarIcon className="text-primary" />
                    {monthNames[month]} <span className="text-slate-500">{year}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-border-dark rounded-full text-slate-400 transition-colors">←</button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-border-dark rounded-full text-slate-400 transition-colors">→</button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4 text-center mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-xs font-bold text-slate-500 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-background-dark rounded-xl"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const daysAlbums = albumsByDay[day] || [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const hasAlbums = daysAlbums.length > 0;

                    return (
                        <div key={day}
                            onClick={() => hasAlbums && setSelectedDay({ day, albums: daysAlbums })}
                            className={`aspect-square rounded-xl border relative overflow-hidden group transition-all cursor-pointer ${isToday ? 'border-primary ring-1 ring-primary/50' : 'border-border-dark bg-background-dark hover:border-primary/50'
                                }`}
                        >
                            <span className={`absolute top-2 left-2 text-[10px] font-bold z-20 pointer-events-none drop-shadow-md ${hasAlbums ? 'text-white' : 'text-slate-600'
                                }`}>
                                {day}
                            </span>

                            {hasAlbums ? (
                                <div className="absolute inset-0 flex flex-wrap h-full w-full">
                                    {daysAlbums.map((album, idx) => (
                                        <div key={idx} className="relative flex-grow h-full" style={{ flexBasis: `${100 / daysAlbums.length}%` }}>
                                            <img
                                                src={album.cover}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" }}
                                            />
                                            <div className="absolute inset-0 bg-black/10 border-r border-black/20 last:border-0"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-800">
                                    <Disc size={16} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Day Details Modal (Inside Component) */}
            {selectedDay && (
                <div className="absolute inset-0 z-30 bg-surface-dark/95 backdrop-blur-md rounded-xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-white">
                            Listened on {selectedDay.day} {monthNames[month]}
                        </h3>
                        <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {selectedDay.albums.map((album, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-background-dark rounded-xl border border-border-dark">
                                <img src={album.cover} className="size-16 rounded-lg object-cover bg-slate-800" alt="" />
                                <div>
                                    <h4 className="font-bold text-white">{album.title}</h4>
                                    <p className="text-sm text-primary font-medium">{album.artist}</p>
                                    <div className="mt-2 flex gap-2">
                                        <StatusBadge status={album.status} />
                                        {album.rating > 0 && <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Star size={10} fill="currentColor" /> {album.rating}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Dashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('collection'); // 'collection', 'calendar', 'blog'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [albums, setAlbums] = useState([]);

    // Community albums state seems unused in previous code but logic was there, keeping placeholder if needed.
    // Assuming mostly personal collection for now based on previous displayedAlbums logic.

    const [loading, setLoading] = useState(true);
    const [blogPosts, setBlogPosts] = useState([]);
    const [newBlogPost, setNewBlogPost] = useState("");
    const [postingBlog, setPostingBlog] = useState(false);

    // Modal & Search
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");
    const [sortBy, setSortBy] = useState("date_added");
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

    const fetchBlog = async () => {
        try {
            const res = await api.get('/blog');
            setBlogPosts(res.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchAlbums();
    }, []);

    useEffect(() => {
        if (activeTab === 'blog') {
            fetchBlog();
        }
    }, [activeTab]);

    // Filters & Sorting
    const getFilteredAlbums = (sourceList) => {
        let filtered = sourceList.filter(album => {
            const matchesSearch = album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                album.artist.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterStatus === "Todos" || album.status === filterStatus;
            return matchesSearch && matchesFilter;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
            if (sortBy === 'status') return a.status.localeCompare(b.status);
            // Default: date_added (desc)
            return new Date(b.date_added) - new Date(a.date_added);
        });
    };

    const displayedAlbums = getFilteredAlbums(albums);

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

    const handlePostBlog = async (e) => {
        e.preventDefault();
        setPostingBlog(true);
        try {
            await api.post('/blog', { content: newBlogPost });
            setNewBlogPost("");
            await fetchBlog();
        } catch (error) { console.error(error); } finally { setPostingBlog(false); }
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

    const searchExternal = async () => {
        if (!apiSearchQuery) return;
        setSearchingApi(true);
        try {
            const res = await api.get(`/search?q=${encodeURIComponent(apiSearchQuery)}`);
            setSearchResults(res.data);
        } catch (err) { console.error(err); } finally { setSearchingApi(false); }
    };

    const selectSearchResult = (result) => {
        setNewAlbum({ ...newAlbum, title: result.title, artist: result.artist, cover: result.cover || "" });
        setSearchResults([]); setApiSearchQuery("");
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-background-dark"><Loader2 className="animate-spin text-primary" /></div>;

    const navItems = [
        { id: 'collection', label: 'Library', icon: Library },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'blog', label: 'Blog', icon: Newspaper },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background-light dark:bg-background-dark border-r border-border-dark transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
                        <Disc size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Spin52</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Personal Music Vault</p>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-left ${activeTab === item.id
                                ? 'bg-primary text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-dark'}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border-dark">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-dark cursor-pointer transition-colors group">
                        <div className="size-10 rounded-full bg-surface-dark flex items-center justify-center text-primary font-bold">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username}</p>
                        </div>
                        <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark relative">
                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                {/* Top Navigation Bar */}
                <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500">
                            <Menu size={24} />
                        </button>
                        <div className="relative w-full max-w-md hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                className="w-full bg-slate-200 dark:bg-surface-dark border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-500"
                                placeholder="Buscar en tu colección..."
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {activeTab === 'collection' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">AÑADIR ÁLBUM</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    {/* Page Title & Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {activeTab === 'collection' && 'Tus Álbumes'}
                                {activeTab === 'calendar' && 'Historial de Escucha'}
                                {activeTab === 'blog' && 'Blog'}
                            </h2>
                            {activeTab === 'collection' && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{albums.length} álbumes en tu colección</p>
                            )}
                        </div>

                        {activeTab === 'collection' && (
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { id: 'Todos', label: 'All', emoji: '♾️' },
                                    { id: 'Pendiente', label: 'Pendiente', emoji: '⏳' },
                                    { id: 'Escuchando', label: 'Escuchando', emoji: '🎧' },
                                    { id: 'Escuchado', label: 'Escuchado', emoji: '✅' }
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => setFilterStatus(status.id)}
                                        className={`flex h-9 items-center justify-center gap-2 rounded-lg px-3 md:px-4 text-xs font-bold transition-colors ${filterStatus === status.id
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-200 dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-border-dark'
                                            }`}
                                        title={status.label}
                                    >
                                        <span className="md:hidden text-lg">{status.emoji}</span>
                                        <span className="hidden md:inline">{status.id === 'Todos' ? 'All' : status.id}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Views */}
                    {activeTab === 'collection' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 pb-20">
                            {displayedAlbums.map((album) => (
                                <div key={album.id}
                                    onClick={() => navigate(`/album/${album.id}`)}
                                    className="group flex flex-col gap-3 cursor-pointer"
                                >
                                    <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-dark shadow-lg ring-1 ring-white/5">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                            style={{ backgroundImage: `url('${album.cover}')` }}
                                        ></div>
                                        {/* Fallback color if no image */}
                                        {!album.cover && <div className="absolute inset-0 bg-surface-dark flex items-center justify-center"><Disc className="text-border-dark" size={40} /></div>}

                                        <div className="absolute top-3 left-3">
                                            <StatusBadge status={album.status} />
                                        </div>

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px]">
                                            <button className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <PlayCircle size={28} fill="white" className="border-none" />
                                            </button>
                                        </div>

                                        {/* Actions Overlay */}
                                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                            <button onClick={(e) => { e.stopPropagation(); deleteAlbum(album.id); }} className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md">
                                                <LogOut size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm truncate text-slate-900 dark:text-white group-hover:text-primary transition-colors">{album.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{album.artist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="max-w-4xl mx-auto">
                            <CalendarView albums={albums} />
                        </div>
                    )}

                    {activeTab === 'blog' && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-surface-dark rounded-xl p-6 shadow-sm border border-border-dark">
                                <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                                    <MessageSquare className="text-primary" /> Nueva Publicación
                                </h2>
                                <form onSubmit={handlePostBlog} className="space-y-4">
                                    <textarea
                                        className="w-full bg-background-dark border border-border-dark rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary font-medium text-slate-200 resize-none min-h-[100px]"
                                        placeholder="Comparte algo con la comunidad..."
                                        value={newBlogPost}
                                        onChange={e => setNewBlogPost(e.target.value)}
                                        required
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={postingBlog}
                                            className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                        >
                                            {postingBlog ? 'Publicando...' : 'Publicar'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="space-y-6">
                                {blogPosts.map((post) => (
                                    <div key={post.id} className="bg-surface-dark rounded-xl p-6 shadow-sm border border-border-dark relative overflow-hidden">
                                        {post.username === user.username && (
                                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl">
                                                Tú
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-border-dark flex items-center justify-center font-bold text-slate-400 text-lg uppercase">
                                                {post.username[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-100">{post.username}</div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {new Date(post.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-14">
                                            {post.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal - Kept darker style for contrast but aligned with theme colors */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-surface-dark rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border-dark">
                        <div className="p-8 border-b border-border-dark">
                            <h2 className="text-2xl font-bold text-white"><span className="text-primary">Añadir</span> Álbum</h2>
                            <div className="flex gap-2 mt-4">
                                <input className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                                    placeholder="Buscar en Spotify..." value={apiSearchQuery} onChange={e => setApiSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchExternal()} />
                                <button onClick={searchExternal} className="bg-primary text-white p-3 rounded-xl hover:bg-blue-600 transition-colors">{searchingApi ? <Loader2 className="animate-spin" /> : <Search />}</button>
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 bg-background-dark rounded-xl overflow-hidden max-h-40 overflow-y-auto border border-border-dark">
                                    {searchResults.map((r, i) => (
                                        <div key={i} onClick={() => selectSearchResult(r)} className="p-3 hover:bg-surface-dark cursor-pointer flex gap-3 text-sm font-bold border-b border-border-dark/50 text-slate-300 last:border-0">
                                            <img src={r.cover} className="w-8 h-8 rounded bg-slate-200" alt="" /> {r.title} - <span className="text-slate-500">{r.artist}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleAddAlbum} className="p-8 space-y-4 text-slate-300">
                            <input className="w-full bg-background-dark border border-border-dark p-3 rounded-xl outline-none focus:border-primary" placeholder="Título" required value={newAlbum.title} onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })} />
                            <input className="w-full bg-background-dark border border-border-dark p-3 rounded-xl outline-none focus:border-primary" placeholder="Artista" required value={newAlbum.artist} onChange={e => setNewAlbum({ ...newAlbum, artist: e.target.value })} />

                            <div className="grid grid-cols-2 gap-4">
                                <select className="bg-background-dark border border-border-dark p-3 rounded-xl outline-none focus:border-primary" value={newAlbum.status} onChange={e => setNewAlbum({ ...newAlbum, status: e.target.value })}>
                                    <option value="Pendiente">Pendiente</option><option value="Escuchando">Escuchando</option><option value="Escuchado">Escuchado</option>
                                </select>
                                <input className="bg-background-dark border border-border-dark p-3 rounded-xl outline-none focus:border-primary" placeholder="URL de la Portada" value={newAlbum.cover} onChange={e => setNewAlbum({ ...newAlbum, cover: e.target.value })} />
                            </div>

                            {newAlbum.status === 'Escuchado' && (
                                <div className="space-y-2 bg-background-dark p-4 rounded-xl border border-border-dark">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Valoración</label>
                                        <span className="text-primary font-bold bg-primary/10 px-2 py-0.5 rounded text-xs">{newAlbum.rating}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="5" step="0.5"
                                        className="w-full h-1 appearance-none bg-surface-dark rounded-full cursor-pointer accent-primary"
                                        value={newAlbum.rating}
                                        onChange={e => setNewAlbum({ ...newAlbum, rating: parseFloat(e.target.value) })}
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-background-dark hover:bg-surface-dark py-3 rounded-xl font-bold text-xs uppercase transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase shadow-lg shadow-primary/20 transition-all">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
