import React, { useState } from 'react';

interface AuthScreenProps {
    onLogin: (token: string) => void;
    apiBaseUrl: string;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, apiBaseUrl }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log(`Auth attempt: ${isLogin ? 'Login' : 'Register'} for ${username} at ${apiBaseUrl}`);
            if (isLogin) {
                const formData = new URLSearchParams();
                formData.append('username', username);
                formData.append('password', password);

                const response = await fetch(`${apiBaseUrl}/auth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });

                const data = await response.json();
                if (response.ok) {
                    onLogin(data.access_token);
                } else {
                    setError(data.detail || 'Login failed');
                }
            } else {
                console.log("Calling register endpoint...");
                const response = await fetch(`${apiBaseUrl}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                console.log("Register response status:", response.status);

                const data = await response.json();
                if (response.ok) {
                    onLogin(data.access_token);
                } else {
                    setError(data.detail || 'Registration failed');
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError('Connection failed. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-sm space-y-8 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[32px] bg-white flex items-center justify-center shadow-2xl mb-8 overflow-hidden border border-zinc-200">
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        UB System
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mono">
                        {isLogin ? 'Authentication Protocol' : 'New User Initialization'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-bold placeholder:text-zinc-700"
                                placeholder="Username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-bold placeholder:text-zinc-700"
                                placeholder="********"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase p-4 rounded-xl tracking-wider text-center">
                            Error: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${loading
                            ? 'bg-zinc-800 text-zinc-500'
                            : 'bg-white text-black shadow-xl hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-900 rounded-full animate-spin"></div>
                        ) : (
                            isLogin ? 'Sign In' : 'Join Program'
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        {isLogin ? "Need an account? Register" : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
