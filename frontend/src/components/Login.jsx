import React, { useState } from 'react';
import { Headphones, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import api from '../api';

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const endpoint = isRegistering ? '/register' : '/login';

        try {
            const res = await api.post(endpoint, formData);
            if (res.data.auth) {
                onLogin(res.data.token, res.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <img src="/logo_new.png" alt="Spin52 Logo" className="w-24 h-24 object-contain" />
                    </div>

                    <h2 className="text-3xl font-black text-center mb-2 tracking-tight italic">
                        Spin<span className="text-sky-500">52</span>
                    </h2>
                    <p className="text-center text-slate-400 mb-8 font-bold text-sm uppercase tracking-wider">Tu viaje musical de 2026</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Usuario</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-bold text-white placeholder-slate-600"
                                placeholder="tu_nombre_usuario"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-bold text-white placeholder-slate-600"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <span className="animate-pulse">Procesando...</span>
                            ) : (
                                <>
                                    {isRegistering ? "Crear Cuenta" : "Entrar"}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {isRegistering ? (
                                <>¿Ya tienes cuenta? <LogIn size={16} /> Inicia Sesión</>
                            ) : (
                                <>¿Nuevo por aquí? <UserPlus size={16} /> Regístrate</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
