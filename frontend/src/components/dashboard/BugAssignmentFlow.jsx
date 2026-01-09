import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { GitPullRequest, LayoutDashboard, Users } from 'lucide-react';

export function BugAssignmentFlow({ projectId, projectKey, defaultView = 'flow', hideToggle = false }) {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(defaultView); // 'flow' or 'reporter'

    const fetchData = (isSilent = false) => {
        if (!projectId) return;
        if (!isSilent) setLoading(true);
        axios.get(`${API_URL}/api/dashboard/bug-flow?project_id=${projectId}`)
            .then(res => {
                setRawData(res.data);
            })
            .catch(err => {
                console.error(err);
                setRawData([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, [projectId]);

    const chartData = useMemo(() => {
        if (viewMode === 'flow') {
            return rawData.map(d => ({
                label: `${d.reporter} → ${d.assignee}`,
                count: d.count,
                reporter: d.reporter,
                assignee: d.assignee
            })).slice(0, 10);
        } else {
            // Aggregate by reporter
            const reporterCounts = {};
            rawData.forEach(d => {
                reporterCounts[d.reporter] = (reporterCounts[d.reporter] || 0) + d.count;
            });
            return Object.entries(reporterCounts)
                .map(([name, count]) => ({
                    label: name,
                    count,
                    reporter: name
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }
    }, [rawData, viewMode]);

    const handleBarClick = (data) => {
        if (!data || !projectKey) return;

        let jql = `project = "${projectKey}" AND issuetype = Bug`;

        if (viewMode === 'flow') {
            if (data.reporter) jql += ` AND reporter = "${data.reporter}"`;
            if (data.assignee) jql += ` AND assignee = "${data.assignee}"`;
        } else {
            if (data.reporter) jql += ` AND reporter = "${data.reporter}"`;
        }

        const url = `https://skyelectric.atlassian.net/issues/?jql=${encodeURIComponent(jql)}`;
        window.open(url, '_blank');
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#14b8a6', '#f97316'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-slate-200 dark:text-slate-900 p-3 rounded-xl shadow-2xl border transition-all duration-200">
                    <p className="font-extrabold text-[12px] uppercase tracking-wider mb-2">{label}</p>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 text-[11px]">
                                <span className="font-medium opacity-80">{viewMode === 'flow' ? 'Pair Density:' : 'Total Output:'}</span>
                                <span className="font-bold text-blue-400 dark:text-blue-600">{entry.value} Bugs</span>
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
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">
                            <GitPullRequest size={18} />
                        </div>
                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                            {viewMode === 'flow' ? 'Defect Ownership (Flow)' : 'Defect Ownership (By Person)'}
                        </CardTitle>
                    </div>
                    {!hideToggle && (
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border dark:border-slate-800">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-2 text-[9px] font-bold uppercase tracking-tight transition-all ${viewMode === 'flow' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                onClick={() => setViewMode('flow')}
                                title="Show Reporter -> Assignee Flow"
                            >
                                <LayoutDashboard size={10} className="mr-1" />
                                Flow
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 px-2 text-[9px] font-bold uppercase tracking-tight transition-all ${viewMode === 'reporter' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                onClick={() => setViewMode('reporter')}
                                title="Show Reporter Leaderboard"
                            >
                                <Users size={10} className="mr-1" />
                                Person
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-2">
                <div className="h-full min-h-[120px] pb-6">
                    {loading ? (
                        <div className="h-full flex items-center justify-center animate-pulse bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-400 font-medium">Mapping bug traffic...</p>
                        </div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 100, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="label"
                                    type="category"
                                    tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor', textAnchor: 'end' }}
                                    className="text-slate-500 dark:text-slate-400"
                                    width={250}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'currentColor', className: 'text-slate-50/50 dark:text-slate-900/30' }}
                                    content={<CustomTooltip />}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[0, 4, 4, 0]}
                                    barSize={22}
                                    onClick={(data) => handleBarClick(data)}
                                    className="cursor-pointer"
                                    title="Click to view issues in Jira"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            fillOpacity={0.8}
                                            className="hover:fill-opacity-100 transition-all duration-200 cursor-pointer"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium italic text-sm bg-slate-50/30 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-2xl">
                            No bug assignment flows recorded
                        </div>
                    )}
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 text-center mt-4 font-bold uppercase tracking-widest">
                        {viewMode === 'flow' ? 'Defect Ownership & Allocation Intelligence' : 'Total Bugs Reported by Person'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
