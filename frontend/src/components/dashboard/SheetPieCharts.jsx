
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, AlertCircle, Server, Cloud, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = {
    qa: '#10b981',          // emerald-500 (Completed QA)
    pendingQa: '#3b82f6',   // blue-500 (Developed but not QA'ed)
    remaining: '#e2e8f0',   // slate-200 (Not yet developed)
    remainingDark: '#1e293b' // slate-800
};

export const SheetPieCharts = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        const fetchData = async (isSilent = false) => {
            if (!isSilent) setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/api/dashboard/sheet-progress`);
                if (response.data.status === 'success') {
                    setData(response.data);
                    setError(null);
                } else {
                    setError(response.data.error || 'Failed to fetch sheet data');
                }
            } catch (err) {
                console.error('Error fetching sheet data:', err);
                if (!isSilent) setError('Connection error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-3xl">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 p-6 text-center rounded-3xl">
                <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
                <CardTitle className="text-sm">Sheet Integration Failed</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{error}</p>
            </Card>
        );
    }

    const renderSection = (title, sectionData) => {
        const dev = sectionData.development;
        const qa = sectionData.qa;

        // Logic: QA is inside Dev. 
        // Example: Dev 55%, QA 20% -> [QA: 20, PendingQA: 35, Remaining: 45]
        const pendingQa = Math.max(0, dev - qa);
        const remaining = Math.max(0, 100 - dev);

        const chartData = [
            { name: 'QA Completed', value: qa, color: COLORS.qa },
            { name: 'Pending QA', value: pendingQa, color: COLORS.pendingQa },
            { name: 'Not Developed', value: remaining, color: isDarkMode ? COLORS.remainingDark : COLORS.remaining },
        ];

        return (
            <div className="flex flex-col items-center justify-center h-full w-full min-h-[220px]">
                <h3 className="text-[clamp(16px,1.5cqi,18px)] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
                <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                wrapperStyle={{ zIndex: 1000 }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    color: isDarkMode ? '#ffffff' : '#000000'
                                }}
                                itemStyle={{ padding: '2px 0' }}
                                cursor={{ fill: 'transparent' }}
                                formatter={(value) => `${value.toFixed(0)}%`}
                            />

                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center justify-center"
                        >
                            {title === "PCS" && (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.08, 1],
                                        opacity: [0.7, 1, 0.7],
                                        rotateZ: [0, 1, -1, 0]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Server className="h-16 w-16 text-amber-500/80 drop-shadow-2xl" />
                                </motion.div>
                            )}
                            {title === "Cloud" && (
                                <motion.div
                                    animate={{
                                        y: [0, -12, 0],
                                        x: [0, 6, 0],
                                        scale: [1, 1.05, 1]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Cloud className="h-16 w-16 text-emerald-500/80 drop-shadow-2xl" />
                                </motion.div>
                            )}
                            {title === "APP" && (
                                <motion.div
                                    animate={{
                                        rotate: [0, -8, 8, -8, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                                >
                                    <Smartphone className="h-16 w-16 text-blue-500/80 drop-shadow-2xl" />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 w-full max-w-[280px]">
                    <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[clamp(9px,0.9cqi,11px)] font-black text-slate-600 dark:text-slate-400 tracking-tight uppercase">
                            DEV: <span className="text-[clamp(12px,1.1cqi,14px)] text-blue-600 dark:text-blue-400 ml-0.5">{dev.toFixed(0)}%</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[clamp(9px,0.9cqi,11px)] font-black text-slate-600 dark:text-slate-400 tracking-tight uppercase">
                            QA: <span className="text-[clamp(12px,1.1cqi,14px)] text-emerald-600 dark:text-emerald-400 ml-0.5">{qa.toFixed(0)}%</span>
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col">
            <CardHeader className="py-3 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[clamp(11px,1cqi,13px)] font-black uppercase tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                        component wise distribution
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-[clamp(8px,0.8cqi,10px)] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full tracking-tighter">SOURCE: PROGRESS_CHECK</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden">
                {renderSection("PCS", data.pcs)}
                {renderSection("Cloud", data.cloud)}
                {renderSection("APP", data.app)}
            </CardContent>
        </Card>
    );
};
