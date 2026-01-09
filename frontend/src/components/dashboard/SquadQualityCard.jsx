
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, AlertCircle, ShieldCheck, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

export const SquadQualityCard = ({ squadName, colorClass, icon: Icon = Bug }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/bugs/epic-stats`);
            const squadData = response.data.breakdown[squadName.toUpperCase()];
            setData(squadData);
            setError(null);
        } catch (err) {
            console.error(`Error fetching ${squadName} quality stats:`, err);
            if (!isSilent) setError('Failed to sync');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, [squadName]);

    if (loading && !data) {
        return (
            <Card className="h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-3xl">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 p-4 text-center rounded-3xl">
                <AlertCircle className="h-5 w-5 text-rose-500 mb-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase">{error}</span>
            </Card>
        );
    }

    const total = (data?.done || 0) + (data?.open || 0);

    // Explicit mapping and accumulation for Jira priorities
    const getPriorityCounts = () => {
        const counts = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
        if (!data?.priorities) return counts;

        Object.entries(data.priorities).forEach(([p, count]) => {
            const name = p.toLowerCase();
            if (name.includes('crit') || name.includes('highest')) counts['Critical'] += count;
            else if (name.includes('high')) counts['High'] += count;
            else if (name.includes('med')) counts['Medium'] += count;
            else if (name.includes('low')) counts['Low'] += count;
        });
        return counts;
    };

    const priorityCounts = getPriorityCounts();

    const formatTime = (totalHours, count) => {
        if (!count || count === 0 || !totalHours) return '0h';
        const avg = totalHours / count;
        if (avg < 1) return (avg * 60).toFixed(0) + 'm';
        if (avg < 24) return avg.toFixed(1) + 'h';
        return (avg / 24).toFixed(1) + 'd';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full"
        >
            <Card className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <CardHeader className="py-2.5 px-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                    <div className="flex items-center justify-between">
                        <CardTitle className={`text-[12px] font-black uppercase tracking-[0.15em] flex items-center gap-2 ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                            {squadName} QUALITY
                        </CardTitle>
                        <div className="h-2 w-2 rounded-full bg-emerald-500/50 animate-pulse" />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-5 lg:p-6 flex flex-col justify-between overflow-hidden">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Row 1 & 2: Left Total Bugs, Right Resolved/Unresolved Percentages */}
                        <div className="col-span-5 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 group">
                            <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                                <motion.div
                                    animate={{
                                        x: [0, 2, -2, 0],
                                        y: [0, -1, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Bug className="h-4 w-4 text-rose-500 fill-rose-500/10" />
                                </motion.div>
                                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-rose-500 transition-colors">Total Bugs</span>
                            </div>
                            <span className="text-4xl font-black text-slate-800 dark:text-slate-200 leading-none">{data?.total || 0}</span>
                        </div>

                        <div className="col-span-7 space-y-3">
                            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-0.5">Resolved</span>
                                <span className="text-2xl font-black text-emerald-500 leading-none">
                                    {total ? ((data?.done || 0) / total * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                            <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 flex flex-col items-center justify-center">
                                <span className="text-[9px] font-black text-rose-600/60 dark:text-rose-400/60 uppercase tracking-widest mb-0.5">Unresolved</span>
                                <span className="text-2xl font-black text-rose-500 leading-none">
                                    {total ? ((data?.open || 0) / total * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        </div>

                        {/* Row 3: Avg Fix Time & QA Timeline */}
                        <div className="col-span-12 space-y-2">
                            <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 flex items-center justify-between px-6">
                                <span className="text-[10px] font-black text-indigo-600/60 dark:text-indigo-400/80 uppercase tracking-widest">Avg Bug Fix Time</span>
                                <span className="text-xl font-black text-indigo-500">{formatTime(data?.fix_time_total_hours, data?.done)}</span>
                            </div>
                            <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 flex items-center justify-between px-6">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/80 uppercase tracking-widest">QA Completion Timeline</span>
                                </div>
                                <span className="text-xl font-black text-emerald-500">
                                    {(() => {
                                        const timeline = data?.qa_timeline || {};
                                        if (squadName.toUpperCase() === 'PCS') return timeline.PCS || '---';
                                        if (squadName.toUpperCase() === 'APP') return timeline.APP || '---';
                                        return timeline.QA || '---'; // Cloud
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mt-6">
                        <span className="text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em] block pb-1 border-b border-slate-100 dark:border-slate-800">Severity Analysis</span>
                        <div className="space-y-3.5">
                            {Object.entries(priorityCounts)
                                .sort((a, b) => {
                                    const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                                    return order[a[0]] - order[b[0]];
                                })
                                .map(([priority, count]) => {
                                    const displayName = priority === 'Critical' ? 'Critical/ Blocker' : priority;
                                    return (
                                        <div key={priority} className="group/item">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight group-hover/item:text-slate-800 dark:group-hover/item:text-slate-200 transition-colors">{displayName}</span>
                                                <span className="text-[12px] font-black text-slate-900 dark:text-slate-100">{count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${total ? (count / total) * 100 : 0}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full ${priority === 'Critical' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                                                        priority === 'High' ? 'bg-rose-500' :
                                                            priority === 'Medium' ? 'bg-amber-500' :
                                                                'bg-blue-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
