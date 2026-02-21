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
            {/* Background Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-sm space-y-8 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-6 animate-bounce-slow overflow-hidden border border-zinc-800">
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
                        Biological Access
                    </h2>
                    <p className="text-green-500/60 text-[10px] font-black uppercase tracking-[0.3em] mono animate-pulse">
                        {isLogin ? 'Initiating Login Sequence' : 'Initializing New Protocol'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-green-500/40 uppercase tracking-widest ml-1">
                                IDENTITY SOURCE (USERNAME)
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-green-500/20 rounded-xl py-4 px-5 text-white outline-none focus:border-green-500/50 transition-all font-bold placeholder:text-zinc-800"
                                placeholder="BEN_TENNYSON"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-green-500/40 uppercase tracking-widest ml-1">
                                ACCESS KEY (PASSWORD)
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-green-500/20 rounded-xl py-4 px-5 text-white outline-none focus:border-green-500/50 transition-all font-bold placeholder:text-zinc-800"
                                placeholder="********"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase p-4 rounded-xl tracking-wider text-center">
                            SYSTEM ERROR: {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${loading
                            ? 'bg-zinc-900 text-zinc-600 grayscale'
                            : 'bg-green-500 text-black shadow-[0_10px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_15px_30px_rgba(34,197,94,0.4)] hover:-translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            isLogin ? 'ACTIVATE' : 'REGISTER'
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[9px] font-black text-green-500/40 uppercase tracking-widest hover:text-green-500 transition-colors"
                    >
                        {isLogin ? "DON'T HAVE AN IDENTITY? REGISTER" : 'ALREADY REGISTERED? LOGIN'}
                    </button>
                </div>
            </div>

            {/* Futuristic Borders */}
            <div className="fixed top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-green-500/20 rounded-tl-3xl pointer-events-none"></div>
            <div className="fixed top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-green-500/20 rounded-tr-3xl pointer-events-none"></div>
            <div className="fixed bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-green-500/20 rounded-bl-3xl pointer-events-none"></div>
            <div className="fixed bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-green-500/20 rounded-br-3xl pointer-events-none"></div>
        </div>
    );
};

export default AuthScreen;
