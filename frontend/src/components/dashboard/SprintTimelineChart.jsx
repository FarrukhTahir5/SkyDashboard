import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Calendar, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function SprintTimelineChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/sprint-timeline?board_ids=50,140`);
            const formatted = response.data
                .map(item => {
                    const start = new Date(item.startDate).getTime();
                    const end = new Date(item.endDate).getTime();
                    return {
                        ...item,
                        displayName: `${item.boardName}: ${item.sprintName}`,
                        duration: [start, end],
                        start,
                        end
                    };
                })
                .sort((a, b) => a.start - b.start);

            setData(formatted);
        } catch (error) {
            console.error("Error fetching sprint timeline:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, []);

    const getStateColor = (state) => {
        switch (state) {
            case 'active': return '#10b981'; // Emerald
            case 'future': return '#3b82f6'; // Blue
            case 'closed': return '#94a3b8'; // Slate
            default: return '#64748b';
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const sprint = payload[0].payload;
            return (
                <div className="bg-slate-900/95 dark:bg-white/95 backdrop-blur-md border border-slate-800 dark:border-slate-200 text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl transition-all duration-300 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-700/50 dark:border-slate-200/50 pb-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${sprint.state === 'active' ? 'animate-pulse' : ''}`} style={{ backgroundColor: getStateColor(sprint.state) }} />
                        <p className="font-black text-[10px] uppercase tracking-widest opacity-70">{sprint.boardName}</p>
                    </div>
                    <p className="font-black text-[15px] mb-3 leading-tight uppercase tracking-tighter">{sprint.sprintName}</p>
                    <div className="space-y-2 text-[11px] font-bold">
                        <div className="flex justify-between items-center opacity-80">
                            <span className="uppercase tracking-widest text-[9px]">Timeline</span>
                            <span>{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="uppercase tracking-widest text-[9px]">Status</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: `${getStateColor(sprint.state)}20`, color: getStateColor(sprint.state) }}>
                                {sprint.state}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const formatDate = (tick) => {
        return new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const ROW_HEIGHT = 55;
    const dynamicHeight = Math.max(200, data.length * ROW_HEIGHT);

    return (
        <Card className="h-full flex flex-col hover:shadow-2xl transition-all duration-500 overflow-hidden dark:bg-slate-900/40 dark:border-slate-800/60 group">
            <CardHeader className="py-4 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-[clamp(14px,1.5cqi,18px)] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter italic">
                                Sprint Execution Roadmap
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Activity size={10} className="text-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Governance</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active</div>
                        {/* <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Future</div>
                        <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Closed</div> */}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative overflow-hidden">
                {loading && data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Calibrating Roadmap...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="h-full overflow-y-auto custom-scrollbar px-2 py-4">
                        <div style={{ height: `${dynamicHeight}px`, minWidth: '600px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    layout="vertical"
                                    margin={{ top: 10, right: 60, left: 10, bottom: 20 }}
                                    barGap={0}
                                >
                                    <XAxis
                                        type="number"
                                        domain={['dataMin - 86400000', 'dataMax + 86400000']}
                                        tickFormatter={formatDate}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        dataKey="displayName"
                                        type="category"
                                        tick={(props) => {
                                            const { x, y, payload } = props;
                                            const item = data.find(d => d.displayName === payload.value);
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <text
                                                        x={-150}
                                                        y={-10}
                                                        dy={0}
                                                        textAnchor="start"
                                                        fill="currentColor"
                                                        className="text-slate-800 dark:text-slate-200 font-black text-[11px] uppercase tracking-tighter"
                                                    >
                                                        {item?.boardName}
                                                    </text>
                                                    <text
                                                        x={-150}
                                                        y={5}
                                                        dy={0}
                                                        textAnchor="start"
                                                        fill="currentColor"
                                                        className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase opacity-70"
                                                    >
                                                        {item?.sprintName}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                        width={160}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'currentColor', opacity: 0.03 }}
                                    />
                                    <Bar
                                        dataKey="duration"
                                        radius={[10, 10, 10, 10]}
                                        barSize={20}
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={getStateColor(entry.state)}
                                                fillOpacity={0.9}
                                                className={`transition-all duration-300 hover:fill-opacity-100 ${entry.state === 'active' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''}`}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                        <Clock size={40} className="text-slate-300" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">No Temporal Data Found</p>
                    </div>
                )}
            </CardContent>
            <div className="py-2 px-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Precision Timeline Visualization</span>
                    <span className="flex items-center gap-1">
                        <Activity size={10} className="text-emerald-500" />
                        Updated Real-time
                    </span>
                </div>
            </div>
        </Card>
    );
}
