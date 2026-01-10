import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Star, Calendar, ArrowLeft, Clock,
    PlayCircle, CheckCircle2, MessageSquare, Plus, Trash2, X
} from 'lucide-react';
import api from '../api';

const StarDisplay = ({ rating }) => {
    return (
        <div className="flex gap-0.5 text-primary">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={20} className={s <= Math.round(rating) ? 'fill-current' : 'text-slate-700'} />
            ))}
        </div>
    );
};

export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [addingHistory, setAddingHistory] = useState(false);

    // Fetch Album Data
    const fetchAlbum = async () => {
        try {
            // Re-fetch all albums to get the one with history populated (since endpoint /api/albums/:id currently doesn't join history in my last backend edit, wait... I only edited /api/albums list... 
            // I should update /api/albums/:id too OR just use the list endpoint and find. 
            // Let's rely on list for now to keep it simple or fetch list and find.
            const res = await api.get('/albums');
            const found = res.data.find(a => a.id === parseInt(id));
            if (found) setAlbum(found);
            else navigate('/');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbum();
    }, [id]);

    const handleUpdateStatus = async (e) => {
        const newStatus = e.target.value;
        const optimistic = { ...album, status: newStatus };
        setAlbum(optimistic);
        try {
            await api.put(`/albums/${id}`, { status: newStatus });
        } catch (error) {
            fetchAlbum();
        }
    };

    const handleUpdateRating = async (newRating) => {
        setAlbum({ ...album, rating: newRating });
        try {
            await api.put(`/albums/${id}`, { rating: newRating });
        } catch (error) { }
    };

    const handleAddHistory = async (e) => {
        e.preventDefault();
        if (!historyDate) return;
        setAddingHistory(true);
        try {
            await api.post(`/albums/${id}/history`, { date: new Date(historyDate).toISOString() });
            await fetchAlbum();
            setHistoryDate("");
        } catch (error) {
            console.error(error);
        } finally {
            setAddingHistory(false);
        }
    };

    const handleDeleteHistory = async (date) => {
        if (!confirm("Remove this listening date?")) return;
        try {
            await api.delete(`/albums/${id}/history`, { data: { date } });
            await fetchAlbum();
        } catch (error) { console.error(error); }
    };

    if (loading || !album) return <div className="min-h-screen bg-background-dark text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border-dark bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-dark rounded-full transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold">Detalles del Álbum</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1280px] mx-auto px-6 lg:px-20 py-8">
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap gap-2 mb-8 text-sm">
                    <Link to="/" className="text-slate-500 hover:text-primary transition-colors">Biblioteca</Link>
                    <span className="text-slate-600">/</span>
                    <span className="text-white font-medium truncate max-w-[200px]">{album.title}</span>
                </nav>

                <section className="flex flex-col lg:flex-row gap-10 mb-12">
                    {/* Cover Art Column */}
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="aspect-square rounded-2xl shadow-2xl bg-surface-dark overflow-hidden border border-border-dark relative group">
                            <img src={album.cover} alt={album.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" }} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        </div>

                        {/* Status Card */}
                        <div className="mt-6 p-6 rounded-2xl bg-surface-dark border border-border-dark">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Estado Actual</label>
                            <select
                                value={album.status}
                                onChange={handleUpdateStatus}
                                className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Escuchando">Escuchando</option>
                                <option value="Escuchado">Escuchado</option>
                            </select>
                            <div className="mt-4 flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Valoración</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleUpdateRating(star)}
                                            className={`p-1 rounded-lg transition-colors ${album.rating >= star ? 'text-primary' : 'text-slate-700 hover:text-slate-500'}`}
                                        >
                                            <Star size={24} fill={album.rating >= star ? "currentColor" : "none"} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-2">{album.title}</h1>
                            <p className="text-2xl text-primary font-bold">{album.artist}</p>
                            <p className="text-slate-500 mt-2 font-medium">Añadido el {new Date(album.date_added).toLocaleDateString()}</p>
                        </div>

                        {/* Listening History */}
                        <div className="bg-surface-dark/50 p-6 rounded-2xl border border-border-dark">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Calendar className="text-primary" size={20} /> Historial de Escucha
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {(album.listening_dates || []).sort((a, b) => new Date(b) - new Date(a)).map((date, idx) => (
                                    <div key={idx} className="group relative flex items-center gap-2 bg-background-dark border border-border-dark px-4 py-2 rounded-xl text-sm font-bold text-slate-300">
                                        {new Date(date).toLocaleDateString()}
                                        <button onClick={() => handleDeleteHistory(date)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1 rounded-full transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {(album.listening_dates || []).length === 0 && (
                                    <p className="text-slate-500 text-sm italic">Aún no hay sesiones registradas.</p>
                                )}
                            </div>

                            <form onSubmit={handleAddHistory} className="flex gap-4 items-stretch bg-background-dark p-4 rounded-xl border border-border-dark max-w-sm">
                                <div className="flex-1 bg-surface-dark rounded-xl border border-border-dark flex items-center px-4 hover:border-primary transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                                    <input
                                        type="date"
                                        required
                                        value={historyDate}
                                        onChange={e => setHistoryDate(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-white font-bold outline-none text-lg h-full"
                                    />
                                </div>
                                <button type="submit" disabled={addingHistory} className="bg-slate-700 text-white px-6 rounded-xl hover:bg-slate-600 transition-colors shadow-lg shadow-slate-700/20 flex items-center justify-center">
                                    <Plus size={24} />
                                </button>
                            </form>
                        </div>

                        {/* Review Section */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="text-primary" size={20} /> Mi Reseña
                            </h3>
                            <div className="rounded-2xl border border-border-dark overflow-hidden bg-surface-dark">
                                <textarea
                                    className="w-full min-h-[160px] p-6 bg-transparent border-none focus:ring-0 text-slate-300 resize-none leading-relaxed font-medium placeholder-slate-600"
                                    placeholder="Escribe tus pensamientos sobre este álbum..."
                                    defaultValue={album.review || ''}
                                    onBlur={async (e) => {
                                        try { await api.put(`/albums/${id}`, { review: e.target.value }); } catch (err) { }
                                    }}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
