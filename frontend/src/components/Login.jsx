import React, { useState } from 'react';
import { ArrowRight, UserPlus, LogIn } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center bg-background-dark text-white p-4 font-display">
            <div className="w-full max-w-md bg-surface-dark/50 backdrop-blur-xl border border-border-dark p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <img src="/logo_new.png" alt="Spin52 Logo" className="w-24 h-24 object-contain" />
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-2 tracking-tight italic">
                        Spin<span className="text-primary">52</span>
                    </h2>
                    <p className="text-center text-slate-400 mb-8 font-bold text-sm uppercase tracking-wider">Your Musical Journey 2026</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-background-dark/50 border border-border-dark rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold text-white placeholder-slate-600"
                                placeholder="username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-background-dark/50 border border-border-dark rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-bold text-white placeholder-slate-600"
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
                            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    {isRegistering ? "Create Account" : "Sign In"}
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
                                <>Already have an account? <LogIn size={16} /> Sign In</>
                            ) : (
                                <>New here? <UserPlus size={16} /> Register</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
