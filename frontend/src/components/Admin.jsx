import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Users, Lock, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Admin() {
    const navigate = useNavigate();
    const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('adminToken'));
    const [users, setUsers] = useState([]);
    const [blogPosts, setBlogPosts] = useState([]);
    const [envVars, setEnvVars] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        sessionStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
        fetchUsers();
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/users', {
                headers: { 'x-admin-token': token }
            });
            setUsers(res.data);

            const envRes = await axios.get('/api/admin/env', {
                headers: { 'x-admin-token': token }
            });
            setEnvVars(envRes.data);

            setError('');
        } catch (err) {
            setError('Acceso Denegado o Token Inválido');
            setIsAuthenticated(false);
            sessionStorage.removeItem('adminToken');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿ELIMINAR USUARIO? Se borrarán todos sus datos.')) return;
        try {
            await axios.delete(`/api/admin/users/${id}`, {
                headers: { 'x-admin-token': token }
            });
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('¿Eliminar esta entrada?')) return;
        try {
            await axios.delete(`/api/admin/blog/${id}`, {
                headers: { 'x-admin-token': token }
            });
            setBlogPosts(blogPosts.filter(p => p.id !== id));
        } catch (err) {
            alert('Error al eliminar entrada');
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchUsers();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen grid place-items-center bg-slate-900 text-white p-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <Shield size={48} className="mx-auto text-indigo-500 mb-4" />
                        <h1 className="text-2xl font-black uppercase tracking-widest">Admin Access</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Admin Token"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-center font-mono tracking-widest"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                        />
                        <button className="w-full bg-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                            Entrar
                        </button>
                        {error && <p className="text-red-400 text-center text-xs font-bold">{error}</p>}
                    </form>
                    <button onClick={() => navigate('/')} className="block w-full text-center mt-8 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest">
                        Volver a la App
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-slate-900 text-white p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="text-indigo-500" />
                        <span className="font-bold">Admin Panel</span>
                    </div>
                    <button onClick={() => {
                        sessionStorage.removeItem('adminToken');
                        setIsAuthenticated(false);
                        navigate('/');
                    }} className="text-slate-400 hover:text-white">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                            <Users size={20} className="text-slate-400" /> Usuarios ({users.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {users.map(u => (
                            <div key={u.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900">{u.username}</p>
                                    <p className="text-xs text-slate-400 font-mono">ID: {u.id} • Registrado: {u.created_at}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(u.id)}
                                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {users.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-400 font-medium">No hay usuarios</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                            <MessageSquare size={20} className="text-slate-400" /> Blog ({blogPosts.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                        {blogPosts.map(post => (
                            <div key={post.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-xs text-sky-500">{post.username}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                                </div>
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {blogPosts.length === 0 && (
                            <div className="p-12 text-center text-slate-400 font-medium">No hay entradas</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                            <Lock size={20} className="text-slate-400" /> Environment Variables
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(envVars).map(([key, value]) => (
                                <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                    <p className="font-mono text-sm text-slate-700 font-bold truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
