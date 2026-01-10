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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Headphones className="text-white w-10 h-10" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Melodía 52</h2>
                    <p className="text-center text-indigo-200 mb-8 font-medium">Tu viaje musical de 2026</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-indigo-300 ml-1">Usuario</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-white placeholder-white/30"
                                placeholder="tu_nombre_usuario"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-indigo-300 ml-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-white placeholder-white/30"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-xl text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 mt-4"
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
                            className="text-sm font-bold text-indigo-300 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
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
