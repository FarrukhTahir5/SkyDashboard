
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export const CombinedQualityCard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/bugs/epic-stats`);
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching quality stats:', err);
            setError('Failed to sync quality metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        fetchData();
        const interval = setInterval(fetchData, 60000);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    if (loading && !data) {
        return (
            <Card className="h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-3xl">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 p-4 text-center rounded-3xl">
                <AlertCircle className="h-6 w-6 text-rose-500 mb-2" />
                <span className="text-[10px] text-slate-500 font-bold uppercase">Sync Failed</span>
            </Card>
        );
    }

    const appStats = data?.breakdown?.APP || { done: 0, open: 0, priorities: {} };
    const cloudStats = data?.breakdown?.CLOUD || { done: 0, open: 0, priorities: {} };
    const pcsStats = data?.breakdown?.PCS || { done: 0, open: 0, priorities: {} };

    const grandTotal = {
        done: appStats.done + cloudStats.done + pcsStats.done,
        open: appStats.open + cloudStats.open + pcsStats.open
    };

    const SquadSection = ({ title, stats, colorClass }) => {
        const total = stats.done + stats.open;
        return (
            <div className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-800/10 p-2 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                <div className="text-center mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
                </div>

                <div className="space-y-2 mb-3">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Resolved</span>
                        <span className="text-xs font-black text-emerald-500">{stats.done}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Unresolved</span>
                        <span className="text-xs font-black text-rose-500">{stats.open}</span>
                    </div>
                </div>

                <div className="space-y-1.5 mt-auto">
                    {Object.entries(stats.priorities)
                        .sort((a, b) => {
                            const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                            return (order[a[0]] ?? 99) - (order[b[0]] ?? 99);
                        })
                        .map(([priority, count]) => {
                            const displayName = priority.toLowerCase().includes('critical') ? 'Critical Blocker' : priority;
                            return (
                                <div key={priority} className="group">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[7px] font-bold text-slate-400 uppercase truncate pr-1">{displayName}</span>
                                        <span className="text-[8px] font-black text-slate-700 dark:text-slate-300">{count}</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${priority.toLowerCase().includes('crit') ? 'bg-indigo-500' :
                                                    priority.toLowerCase().includes('high') ? 'bg-rose-500' :
                                                        priority.toLowerCase().includes('med') ? 'bg-amber-500' :
                                                            'bg-blue-500'
                                                }`}
                                            style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col hover:shadow-2xl transition-all duration-300">
            <CardHeader className="py-2.5 px-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Quality Matrix
                    </CardTitle>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Resolved TOTAL</span>
                            <span className="text-sm font-black text-emerald-500 leading-none">{grandTotal.done}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Unresolved TOTAL</span>
                            <span className="text-sm font-black text-rose-500 leading-none">{grandTotal.open}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-3 grid grid-cols-3 gap-2 overflow-hidden">
                <SquadSection title="APP" stats={appStats} colorClass="text-blue-500" />
                <SquadSection title="CLOUD" stats={cloudStats} colorClass="text-emerald-500" />
                <SquadSection title="PCS" stats={pcsStats} colorClass="text-amber-500" />
            </CardContent>
        </Card>
    );
};
