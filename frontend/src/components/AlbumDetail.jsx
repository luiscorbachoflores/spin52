import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Star, Music, Calendar } from 'lucide-react';
import api from '../api';

const StarDisplay = ({ rating, size = 12 }) => {
    return (
        <div className="flex gap-1 justify-center">
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

export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [wiki, setWiki] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        review: '',
        rating: 0,
        status: 'Pendiente',
        listenedAt: '',
        favorites: [] // Array of strings
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Get Album Data from DB
                const res = await api.get(`/albums/${id}`);
                const data = res.data;
                setAlbum(data);

                // Parse existing favorites (handle legacy comma and new delimiter)
                let currentFavs = [];
                if (data.favorites) {
                    if (Array.isArray(data.favorites)) {
                        currentFavs = data.favorites;
                    } else if (data.favorites.includes(';;')) {
                        currentFavs = data.favorites.split(';;');
                    } else {
                        // Fallback/Legacy
                        currentFavs = data.favorites.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }

                setFormData({
                    review: data.review || '',
                    rating: data.rating || 0,
                    status: data.status,
                    listenedAt: data.listened_at ? data.listened_at.split('T')[0] : (new Date().toISOString().split('T')[0]),
                    favorites: currentFavs
                });

                // 2. Fetch Tracklist from Last.fm Proxy
                if (data.artist && data.title) {
                    const infoRes = await api.get(`/album-info?artist=${encodeURIComponent(data.artist)}&album=${encodeURIComponent(data.title)}`);
                    setTracks(infoRes.data.tracks || []);
                    setWiki(infoRes.data.summary);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/albums/${id}`, {
                ...formData,
                favorites: formData.favorites.join(';;'), // Save as delimiter separated
                listenedAt: formData.status === 'Escuchado' ? formData.listenedAt : null
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const toggleFavorite = (trackName) => {
        setFormData(prev => {
            const exists = prev.favorites.includes(trackName);
            if (exists) {
                return { ...prev, favorites: prev.favorites.filter(t => t !== trackName) };
            } else {
                return { ...prev, favorites: [...prev.favorites, trackName] };
            }
        });
    };

    if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50">Cargando...</div>;
    if (!album) return <div className="min-h-screen grid place-items-center bg-slate-50">Álbum no encontrado</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest text-xs mb-8 transition-colors">
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="relative h-64 md:h-80 bg-slate-900">
                        <img src={album.cover} className="w-full h-full object-cover opacity-60" alt="Header" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{album.title}</h1>
                            <p className="text-xl md:text-2xl text-indigo-300 font-bold">{album.artist}</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Review Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tu Reseña</h3>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[150px] outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 leading-relaxed resize-none"
                                    placeholder="Escribe tus pensamientos sobre este álbum..."
                                    value={formData.review}
                                    onChange={e => setFormData({ ...formData, review: e.target.value })}
                                />
                            </div>

                            {/* Tracklist Selection */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Selecciona tus favoritas</h3>
                                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{formData.favorites.length} seleccionadas</span>
                                </div>

                                {tracks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {tracks.map((track, i) => (
                                            <button
                                                key={i}
                                                onClick={() => toggleFavorite(track)}
                                                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${formData.favorites.includes(track)
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span className="truncate">{i + 1}. {track}</span>
                                                {formData.favorites.includes(track) && <Music size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-slate-400 text-sm font-medium">No se encontró lista de canciones automática.</p>
                                        <div className="mt-4 px-8">
                                            <input
                                                type="text"
                                                placeholder="Escribe favorita y presiona Enter..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        toggleFavorite(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Escuchando">Escuchando</option>
                                        <option value="Escuchado">Escuchado</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                        Calificación <span className="text-indigo-600">{formData.rating}/5</span>
                                    </label>
                                    <input
                                        type="range" min="0" max="5" step="0.5"
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        value={formData.rating}
                                        onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                                    />
                                    <div className="pt-2">
                                        <StarDisplay rating={formData.rating} size={24} />
                                    </div>
                                </div>

                                {formData.status === 'Escuchado' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Fecha de Escucha
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-indigo-500 text-slate-600"
                                            value={formData.listenedAt}
                                            onChange={e => setFormData({ ...formData, listenedAt: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
