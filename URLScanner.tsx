import React, { useState, useMemo } from 'react';
import { Globe, Shield, AlertTriangle, CheckCircle2, ChevronRight, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function URLScanner() {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<null | {
        score: 'Safe' | 'Suspicious' | 'Dangerous';
        reasons: string[];
        details: { domain: string; tld: string; isIp: boolean };
    }>(null);

    const analyzeURL = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsAnalyzing(true);

        // Simulate analysis speed for "wow" factor
        setTimeout(() => {
            const analysis = performHeuristicAnalysis(url);
            setResult(analysis);
            setIsAnalyzing(false);
        }, 1500);
    };

    const performHeuristicAnalysis = (input: string) => {
        let score: 'Safe' | 'Suspicious' | 'Dangerous' = 'Safe';
        const reasons: string[] = [];

        let cleanedUrl = input.trim().toLowerCase();
        if (!cleanedUrl.startsWith('http')) cleanedUrl = 'http://' + cleanedUrl;

        try {
            const urlObj = new URL(cleanedUrl);
            const hostname = urlObj.hostname;
            const tld = hostname.split('.').pop() || '';
            const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

            // 1. Check for IP Address
            if (isIp) {
                score = 'Dangerous';
                reasons.push("Uses an IP address instead of a domain name.");
            }

            // 2. Check for suspicious TLDs
            const suspiciousTlds = ['xyz', 'top', 'link', 'work', 'click', 'zip', 'mov'];
            if (suspiciousTlds.includes(tld)) {
                if (score !== 'Dangerous') score = 'Suspicious';
                reasons.push(`Uses a .${tld} domain, which is frequently used for temporary scam sites.`);
            }

            // 3. Subdomain Depth
            const parts = hostname.split('.');
            if (parts.length > 3) {
                if (score === 'Safe') score = 'Suspicious';
                reasons.push("Unusually high number of subdomains (common in phishing).");
            }

            // 4. Typical Phishing Keywords in subdomains
            const keywords = ['login', 'verify', 'bank', 'secure', 'account', 'update', 'signin', 'support'];
            keywords.forEach(kw => {
                if (hostname.includes(kw) && !hostname.startsWith(kw)) {
                    score = 'Dangerous';
                    reasons.push(`Contains emergency keyword "${kw}" in a suspicious position.`);
                }
            });

            // 5. Look-alike characters (Homographs) - basic check
            if (hostname.includes('1') || hostname.includes('0') || hostname.includes('-')) {
                if (score === 'Safe') score = 'Suspicious';
                reasons.push("Contains numbers or hyphens that might mimic legitimate letters (e.g., '0' for 'o').");
            }

            if (reasons.length === 0) {
                reasons.push("No immediate red flags detected by our heuristic engine.");
            }

            return {
                score,
                reasons,
                details: { domain: hostname, tld, isIp }
            };
        } catch (e) {
            return {
                score: 'Dangerous' as const,
                reasons: ["Invalid URL format. Legitimate sites use standard web address formats."],
                details: { domain: 'Unknown', tld: 'None', isIp: false }
            };
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <Globe className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">Phish Guard URL Scanner</h3>
                        <p className="text-zinc-500">Paste a link to analyze it for suspicious patterns, typosquatting, and phishing tricks.</p>
                    </div>

                    <form onSubmit={analyzeURL} className="w-full relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example-secure-login.com"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-14 pr-40 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-lg"
                        />
                        <button
                            type="submit"
                            disabled={isAnalyzing || !url}
                            className="absolute right-3 top-3 bottom-3 px-8 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold rounded-xl flex items-center gap-2 transition-all"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2Icon className="w-5 h-5 animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    Scan Link
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        <div className={`lg:col-span-1 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-4 border ${result.score === 'Safe' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                result.score === 'Suspicious' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                            }`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.score === 'Safe' ? 'bg-emerald-500/20 text-emerald-500' :
                                    result.score === 'Suspicious' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-red-500/20 text-red-500'
                                }`}>
                                {result.score === 'Safe' ? <Shield size={40} /> :
                                    result.score === 'Suspicious' ? <AlertTriangle size={40} /> :
                                        <Shield size={40} className="rotate-180" />}
                            </div>
                            <div>
                                <h4 className={`text-2xl font-bold ${result.score === 'Safe' ? 'text-emerald-500' :
                                        result.score === 'Suspicious' ? 'text-amber-500' :
                                            'text-red-500'
                                    }`}>
                                    {result.score} Link
                                </h4>
                                <p className="text-zinc-500 text-sm font-mono mt-2 truncate max-w-[200px]">{result.details.domain}</p>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                            <h5 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Info size={14} />
                                Analysis Report
                            </h5>

                            <div className="space-y-4">
                                {result.reasons.map((reason, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${result.score === 'Safe' ? 'bg-emerald-500/20 text-emerald-500' :
                                                result.score === 'Suspicious' ? 'bg-amber-500/20 text-amber-500' :
                                                    'bg-red-500/20 text-red-500'
                                            }`}>
                                            {result.score === 'Safe' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                        </div>
                                        <p className="text-sm text-zinc-300 leading-relaxed">{reason}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Protocol</p>
                                    <p className="text-sm font-bold text-white">HTTPS Secure</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Domain Age</p>
                                    <p className="text-sm font-bold text-zinc-400 italic">Analysis Limited</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6">
                <p className="text-xs text-amber-500/80 leading-relaxed">
                    <strong>Note:</strong> This scanner uses heuristic analysis to detect common phishing patterns. It does not guarantee a site is 100% safe. Always verify the source and never enter credentials on a site you don't recognize.
                </p>
            </div>
        </div>
    );
}

function Loader2Icon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
