
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, AlertCircle, Bug, ChevronDown } from 'lucide-react';

export const BugMetricsChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/bugs/epic-stats`);
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching bug stats:', err);
            if (!isSilent) setError('Failed to sync metrics');
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
        const interval = setInterval(() => fetchData(true), 60000);

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

    const CategoryBreakdown = ({ category }) => {
        const stats = data?.breakdown[category];
        const jql = data?.jql_queries?.[category];
        if (!stats) return null;

        return (
            <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-right-2 duration-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${category === 'APP' ? 'bg-blue-500' :
                        category === 'CLOUD' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                    {category} Quality Breakdown
                </h4>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="block text-[8px] font-black text-slate-500 uppercase">Resolved</span>
                        <span className="text-sm font-black text-emerald-500">{stats.done}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <span className="block text-[8px] font-black text-slate-500 uppercase">Unresolved</span>
                        <span className="text-sm font-black text-rose-500">{stats.open}</span>
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Severity Distribution</span>
                    {Object.entries(stats.priorities).sort((a, b) => b[1] - a[1]).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between group">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{priority}</span>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${priority.toLowerCase().includes('high') ? 'bg-rose-500' :
                                            priority.toLowerCase().includes('medium') ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${(count / (stats.done + stats.open)) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-slate-900 dark:text-slate-200">{count}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {jql && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Audit JQL</span>
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded font-mono text-[9px] break-all text-slate-600 dark:text-slate-400 select-all border border-slate-100 dark:border-slate-800">
                            {jql}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                        {dataPoint.displayDate}
                    </p>
                    <div className="space-y-1.5">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{entry.name}</span>
                                </div>
                                <span className="text-[11px] font-black text-black dark:text-white">{entry.value} Reported</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const categories = ['APP', 'CLOUD', 'PCS'];

    return (
        <Card className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col hover:shadow-2xl transition-all duration-300">
            <CardHeader className="py-3 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[clamp(11px,1cqi,13px)] font-black uppercase tracking-tight flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Bug className="h-4 w-4 text-rose-500" />
                        Tactical Bug Influx <span className="text-[10px] text-slate-500 font-bold ml-1 tracking-widest">(LAST 90 DAYS)</span>
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full tracking-widest uppercase">Live</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-6 pb-2">
                <div className="h-full min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPcs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                            />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 9, fontStretch: 'condensed', fontWeight: 700, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                interval={6}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    paddingBottom: '20px',
                                    textTransform: 'uppercase'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="APP"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorApp)"
                                strokeWidth={3}
                                name="App"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey="CLOUD"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorCloud)"
                                strokeWidth={3}
                                name="Cloud"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey="PCS"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorPcs)"
                                strokeWidth={3}
                                name="PCS"
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
