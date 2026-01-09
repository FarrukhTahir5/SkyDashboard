import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldCheck, TrendingUp, TrendingDown, Clock, Search, CheckCircle2 } from 'lucide-react';

export function BoardQualityChart({ projectId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = (isSilent = false) => {
        if (!projectId) return;
        if (!isSilent) setLoading(true);
        axios.get(`${API_URL}/api/dashboard/board-quality?project_id=${projectId}`)
            .then(res => {
                setData(res.data);
            })
            .catch(err => {
                console.error(err);
                setData([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, [projectId]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-slate-200 dark:text-slate-900 p-3 rounded-xl shadow-2xl border transition-all duration-200">
                    <p className="font-extrabold text-[12px] uppercase tracking-wider mb-2">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="font-medium opacity-80">{entry.name}:</span>
                                </div>
                                <span className={`font-bold ${entry.name.includes('Time') ? 'text-amber-400 dark:text-amber-600' : ''}`}>
                                    {entry.value} {entry.name.includes('Time') ? 'Hrs' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800 animate-shimmer-sweep">
            <CardHeader className="pb-2 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md">
                        <CheckCircle2 size={18} />
                    </div>
                    <CardTitle className="text-[clamp(11px,1cqi,13px)] font-black text-black dark:text-white uppercase tracking-tight">Resolution Timeliness & SLA Compliance</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
                <div className="h-full min-h-[150px] pb-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center animate-pulse bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-400 font-medium">Analyzing board quality metrics...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 'clamp(9px,0.8cqi,11px)', fontWeight: 800, fill: 'currentColor' }}
                                    className="text-black dark:text-white"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 'clamp(9px,0.8cqi,11px)', fill: 'currentColor', fontWeight: 800 }}
                                    className="text-black dark:text-white"
                                    axisLine={false}
                                    tickLine={false}
                                    label={{ value: 'Bugs Count', angle: -90, position: 'insideLeft', style: { fontSize: 'clamp(9px,0.8cqi,11px)', fill: 'currentColor', fontWeight: 900 }, className: 'text-black dark:text-white' }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: '#f59e0b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    label={{ value: 'Hours to Fix', angle: 90, position: 'insideRight', style: { fontSize: 'clamp(9px,0.8cqi,11px)', fill: '#f59e0b', fontWeight: 800 } }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', className: 'text-slate-50/50 dark:text-slate-900/30' }}
                                    content={<CustomTooltip />}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="center"
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: 'clamp(9px,0.8cqi,11px)',
                                        paddingBottom: '20px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase'
                                    }}
                                    formatter={(value) => <span className="text-black dark:text-white tracking-widest">{value}</span>}
                                />
                                <Bar yAxisId="left" dataKey="actual" name="Actual Bug" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} />
                                <Bar yAxisId="left" dataKey="invalid" name="Not a Bug" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="avgTime"
                                    name="Avg Fix Time (Hrs)"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    className="animate-line-flow"
                                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium italic text-sm bg-slate-50/30 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl">
                            Insufficient bug data for board comparisons
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
