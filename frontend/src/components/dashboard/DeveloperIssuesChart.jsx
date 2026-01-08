import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

export function DeveloperIssuesChart({ project, sprintId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!project) return;
        setLoading(true);
        let url = `${API_URL}/api/dashboard/developer-stats?project=${project}`;
        if (sprintId) url += `&sprint_id=${sprintId}`;

        axios.get(url)
            .then(res => {
                setData(res.data);
            })
            .catch(err => {
                console.error(err);
                setData([]);
            })
            .finally(() => setLoading(false));
    }, [project, sprintId]);

    // Extract unique status names for Bar elements
    const statuses = Array.from(new Set(data.flatMap(d => Object.keys(d).filter(k => k !== 'name'))));

    // Premium dynamic color palette
    const PALETTE = [
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#6366f1', // Indigo
        '#14b8a6', // Teal
        '#94a3b8', // Slate
    ];

    // Map to keep track of assigned colors per status during this render cycle
    const statusColorMap = {};
    statuses.forEach((status, index) => {
        statusColorMap[status] = PALETTE[index % PALETTE.length];
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-slate-200 dark:text-slate-900 p-3 rounded-xl shadow-2xl border transition-all duration-200">
                    <p className="font-extrabold text-[12px] uppercase tracking-wider mb-2">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                    <span className="font-medium opacity-80">{entry.name}:</span>
                                </div>
                                <span className="font-bold">{entry.value}</span>
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                            <Users size={18} />
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Resource Utilization & Capacity Governance</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
                <div className="h-full min-h-[120px] pb-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center animate-pulse bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-400 font-medium">Analyzing developer capacity...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 11, fontWeight: 600, fill: 'currentColor' }}
                                    className="text-slate-500 dark:text-slate-400"
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', className: 'text-slate-50/50 dark:text-slate-900/30' }}
                                    content={<CustomTooltip />}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    formatter={(value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>}
                                />
                                {statuses.map((status) => (
                                    <Bar
                                        key={status}
                                        dataKey={status}
                                        stackId="a"
                                        fill={statusColorMap[status]}
                                        radius={[0, 0, 0, 0]}
                                        barSize={24}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium italic text-sm bg-slate-50/30 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl">
                            No active developer assignments in this project
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
