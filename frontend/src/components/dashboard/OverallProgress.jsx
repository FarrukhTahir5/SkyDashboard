
import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = {
    qa: '#10b981',          // emerald-500 (Completed QA)
    pendingQa: '#3b82f6',   // blue-500 (Developed but not QA'ed)
    remaining: '#e2e8f0',   // slate-200 (Not yet developed)
    remainingDark: '#1e293b' // slate-800
};

export function OverallProgress() {
    const [stats, setStats] = useState({ dev: 0, qa: 0 });
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
                    const { pcs, cloud, app } = response.data;

                    // Calculate overall averages
                    const devAvg = (pcs.development + cloud.development + app.development) / 3;
                    const qaAvg = (pcs.qa + cloud.qa + app.qa) / 3;

                    setStats({ dev: devAvg, qa: qaAvg });
                    setError(null);
                } else {
                    setError(response.data.error || 'Failed to fetch sheet data');
                }
            } catch (err) {
                console.error('Error fetching sheet data for compliance:', err);
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

    const pendingQa = Math.max(0, stats.dev - stats.qa);
    const remaining = Math.max(0, 100 - stats.dev);

    const data = [
        { name: 'QA Completed', value: stats.qa, color: COLORS.qa },
        { name: 'Pending QA', value: pendingQa, color: COLORS.pendingQa },
        { name: 'Not Developed', value: remaining, color: isDarkMode ? COLORS.remainingDark : COLORS.remaining },
    ];

    if (loading) {
        return (
            <Card className="h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-3xl">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full"
        >
            <Card
                className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col hover:shadow-2xl transition-all duration-300"
            >
                <CardHeader className="py-3 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                    <CardTitle className="text-[clamp(11px,1cqi,13px)] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">
                        Execution Compliance
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6 flex flex-col items-center justify-center min-h-[220px]">
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    startAngle={90}
                                    endAngle={-270}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center justify-center"
                            >
                                <span className="text-[clamp(24px,2.5cqi,36px)] font-black text-blue-500 drop-shadow-sm leading-none">
                                    {stats.dev.toFixed(0)}%
                                </span>
                                <span className="text-[clamp(8px,0.8cqi,10px)] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                                    DEV DONE
                                </span>
                            </motion.div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center w-full">
                        <div className="flex items-center justify-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[clamp(10px,1cqi,12px)] font-black text-slate-600 dark:text-slate-400 tracking-tighter uppercase whitespace-nowrap">
                                Quality Excellence: <span className="text-[clamp(14px,1.2cqi,16px)] text-emerald-600 dark:text-emerald-400 ml-1">{stats.qa.toFixed(0)}%</span>
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
