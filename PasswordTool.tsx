import React, { useState, useMemo } from 'react';
import { Shield, Lock, Dices, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PasswordTool() {
    const [password, setPassword] = useState('');

    const passwordStrength = useMemo(() => {
        if (!password) return null;
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { label: 'Easy to hack ❌', color: 'text-red-400', bg: 'bg-red-400', width: '33%' };
        if (score <= 4) return { label: 'Moderate Defense ⚠️', color: 'text-amber-400', bg: 'bg-amber-400', width: '66%' };
        return { label: 'Hard to Breach! 🛡️', color: 'text-emerald-400', bg: 'bg-emerald-400', width: '100%' };
    }, [password]);

    const suggestPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        let newPass = "";
        for (let i = 0; i < 16; i++) {
            newPass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPass);
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Lock className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Password Auditor</h3>
                        <p className="text-xs text-zinc-500">Test your strength or generate a shield.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                        <Shield size={18} />
                    </div>
                    <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-mono"
                        placeholder="Type a password to test..."
                    />
                    <button
                        onClick={suggestPassword}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-emerald-500 transition-colors"
                        title="Suggest strong password"
                    >
                        <Dices size={20} className="hover:rotate-45 transition-transform" />
                    </button>
                </div>

                <AnimatePresence>
                    {password && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className={passwordStrength?.color}>{passwordStrength?.label}</span>
                                <span className="text-zinc-500">{password.length} characters</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: passwordStrength?.width }}
                                    className={`h-full ${passwordStrength?.bg}`}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                        { label: 'Length 8+', check: password.length >= 8 },
                        { label: 'Numbers', check: /[0-9]/.test(password) },
                        { label: 'Symbols', check: /[^A-Za-z0-9]/.test(password) },
                        { label: 'Mixed Case', check: /[A-Z]/.test(password) && /[a-z]/.test(password) },
                    ].map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 size={12} className={req.check ? 'text-emerald-500' : 'text-zinc-700'} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${req.check ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {req.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
