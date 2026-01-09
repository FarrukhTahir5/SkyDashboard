import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import axios from 'axios';
import API_URL from '../../config';
import { Layers, Bug, Calendar, AlertCircle } from 'lucide-react';

export function RecentIssuesAndSeverity({ projectId, projectKey, boardId, sprintId, compact = false }) {
    const [issueData, setIssueData] = useState({ total: 0, issues: [], timeline: [] });
    const [severityData, setSeverityData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timePeriod, setTimePeriod] = useState(30);
    const [issueType, setIssueType] = useState("Bug");
    const [unresolvedOnly, setUnresolvedOnly] = useState(true);

    const issueTypes = ["Bug", "Task", "Sub-task", "Story", "Epic"];

    const fetchData = async (isSilent = false) => {
        if (!projectId) return;
        if (!isSilent) setLoading(true);
        try {
            // Fetch Recent Issues
            let issuesUrl = `${API_URL}/api/issues/recent?project_id=${projectId}&days=${timePeriod}&issue_type=${issueType}`;
            if (boardId) issuesUrl += `&board_id=${boardId}`;
            if (sprintId) issuesUrl += `&sprint_id=${sprintId}`;

            const issuesRes = await axios.get(issuesUrl);
            if (issuesRes.data && typeof issuesRes.data === 'object') {
                setIssueData(issuesRes.data);
            } else {
                setIssueData({ total: 0, issues: [], timeline: [] });
            }

            // Fetch Severity Stats
            let severityUrl = `${API_URL}/api/bugs/severity-stats?project_id=${projectId}&days=${timePeriod}&unresolved_only=${unresolvedOnly}`;
            if (boardId) severityUrl += `&board_id=${boardId}`;
            // (Sprint support for severity might depend on backend, usually board is enough for BSD)

            const severityRes = await axios.get(severityUrl);
            if (Array.isArray(severityRes.data)) {
                setSeverityData(severityRes.data);
            } else {
                setSeverityData([]);
            }

        } catch (err) {
            console.error('Failed to fetch dashboard widget data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, [projectId, boardId, sprintId, timePeriod, issueType, unresolvedOnly]);

    const handleIssueClick = (issueKey) => {
        const domain = 'skyelectric.atlassian.net';
        window.open(`https://${domain}/browse/${issueKey}`, '_blank');
    };

    const getIssueColor = () => {
        switch (issueType) {
            case 'Bug': return '#ef4444';
            case 'Task': return '#3b82f6';
            case 'Story': return '#10b981';
            case 'Epic': return '#8b5cf6';
            case 'Sub-task': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const CustomTimelineTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { date, count } = payload[0].payload;
            return (
                <div className="bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-slate-200 dark:text-slate-900 p-3 rounded-xl shadow-2xl border transition-all duration-200">
                    <p className="font-extrabold text-[12px] uppercase tracking-wider">{date}</p>
                    <p className="text-[11px] mt-1.5 font-medium opacity-90">
                        <span className="font-bold text-blue-400 dark:text-blue-600">{count}</span> {issueType.toLowerCase()}{count !== 1 ? 's' : ''} reported
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomSeverityTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0].payload;
            return (
                <div className="bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-slate-200 dark:text-slate-900 p-3 rounded-xl shadow-2xl border transition-all duration-200">
                    <p className="font-extrabold text-[12px] uppercase tracking-wider">{name}</p>
                    <p className="text-[11px] mt-1.5 font-medium opacity-90">
                        Incident Count: <span className="font-bold text-red-400 dark:text-red-600">{value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 7)}w ago`;
    };
    const totalBugs = severityData.reduce((sum, item) => sum + item.value, 0);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Skip tiny slices
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-extrabold drop-shadow-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card className={`h-full flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden dark:bg-slate-900/50 dark:border-slate-800 focus-within:ring-2 ring-primary/20 ${compact ? 'p-0' : ''}`}>
            <CardHeader className={`${compact ? 'pb-2 pt-3 px-4' : 'pb-3'} border-b border-slate-50 dark:border-slate-800`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md ${compact ? 'hidden sm:block' : ''}`}>
                            <Layers size={18} />
                        </div>
                        <div>
                            <CardTitle className={`${compact ? 'text-sm' : 'text-[clamp(14px,1.5cqi,18px)]'} font-black text-black dark:text-white uppercase tracking-tight`}>Operational Traceability & Audit Log</CardTitle>
                            {!compact && (
                                <p className="text-xs text-muted-foreground dark:text-slate-500 mt-0.5">
                                    Unified view for <span className="font-semibold text-slate-700 dark:text-slate-300">{projectKey}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Type Picker */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-md border dark:border-slate-800 scale-90 sm:scale-100">
                            <Select value={issueType} onValueChange={setIssueType}>
                                {issueTypes.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </Select>
                        </div>

                        {/* Period Picker */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-md border dark:border-slate-800 scale-90 sm:scale-100">
                            <Select value={timePeriod.toString()} onValueChange={(v) => setTimePeriod(Number(v))}>
                                <SelectItem value="15">15d</SelectItem>
                                <SelectItem value="30">30d</SelectItem>
                                <SelectItem value="60">60d</SelectItem>
                            </Select>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            disabled={loading}
                            className={`${compact ? 'h-7 w-7 p-0' : 'h-9 px-3'} hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 dark:border-slate-800`}
                        >
                            {loading ? <span className="animate-spin text-xs">⏳</span> : '🔄'}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className={`flex-1 overflow-hidden ${compact ? 'p-3' : 'p-6'} space-y-4`}>
                {/* Visualizations Row */}
                <div className={`grid grid-cols-1 lg:grid-cols-5 gap-4 h-full`}>
                    {/* Timeline (left 3/5) */}
                    <div className="lg:col-span-3 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[clamp(11px,1cqi,13px)] font-black text-black dark:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                                <Calendar size={13} className="text-blue-500" /> Defect Aging Analysis
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                                {issueData.total} {issueType}s
                            </span>
                        </div>
                        <div className="flex-1 min-h-[140px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-lg animate-pulse">
                                    <p className="text-[10px] text-slate-400 font-medium">Syncing timeline...</p>
                                </div>
                            ) : issueData.timeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={issueData.timeline} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 'clamp(9px,0.8cqi,11px)', fill: 'currentColor', fontWeight: 800 }}
                                            className="text-black dark:text-white"
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return `${d.getMonth() + 1}/${d.getDate()}`;
                                            }}
                                        />
                                        <YAxis tick={{ fontSize: 'clamp(9px,0.8cqi,11px)', fill: 'currentColor', fontWeight: 800 }} className="text-black dark:text-white" axisLine={false} tickLine={false} />
                                        <RechartsTooltip content={<CustomTimelineTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke={getIssueColor()}
                                            strokeWidth={2}
                                            dot={{ fill: getIssueColor(), r: 3, strokeWidth: 1, stroke: 'var(--card)' }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium italic text-[10px] bg-slate-50/50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
                                    No records
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pie Chart (right 2/5) */}
                    <div className="lg:col-span-2 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[clamp(11px,1cqi,13px)] font-black text-black dark:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                                <Bug size={13} className="text-red-500" /> Quality Risk Index (QRI)
                            </h4>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                                    {totalBugs}
                                </span>
                                <div className="flex items-center bg-white dark:bg-slate-950 p-0.5 rounded-md border dark:border-slate-800 shadow-sm scale-75 origin-right">
                                    <Select value={unresolvedOnly.toString()} onValueChange={(v) => setUnresolvedOnly(v === 'true')}>
                                        <SelectItem value="true">Open</SelectItem>
                                        <SelectItem value="false">All</SelectItem>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[140px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/30 rounded-lg animate-pulse">
                                    <p className="text-[10px] text-slate-400">Analyzing...</p>
                                </div>
                            ) : severityData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={severityData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={compact ? 35 : 55}
                                            outerRadius={compact ? 55 : 85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={renderCustomizedLabel}
                                            labelLine={false}
                                        >
                                            {severityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomSeverityTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            align="center"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: 'clamp(8px,0.8cqi,10px)', paddingTop: '10px' }}
                                            formatter={(value) => (
                                                <span className="text-[clamp(9px,0.8cqi,11px)] font-black text-black dark:text-white uppercase tracking-tighter">
                                                    {value}
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-medium italic text-[10px] bg-slate-50/50 dark:bg-slate-900/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
                                    Clean record
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Section (Conditional) */}
                {!compact && (
                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-[clamp(10px,1cqi,12px)] font-black text-black dark:text-white uppercase tracking-wider">Change Log Compliance</span>
                        </div>
                        {issueData.issues.length > 0 ? (
                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-950">
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-black border-b dark:border-slate-700 sticky top-0 z-10 uppercase tracking-tighter">
                                            <tr>
                                                <th className="p-3">Key</th>
                                                <th className="p-3">Summary</th>
                                                <th className="p-3">Priority</th>
                                                <th className="p-3">Reported</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-slate-800">
                                            {issueData.issues.map((issue) => (
                                                <tr
                                                    key={issue.key}
                                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                                                    onClick={() => handleIssueClick(issue.key)}
                                                >
                                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400 group-hover:underline">{issue.key}</td>
                                                    <td className="p-3 text-black dark:text-white max-w-xs md:max-w-md">
                                                        <p className="font-bold truncate">{issue.summary}</p>
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-500 font-medium truncate mt-0.5">{issue.reporter}</p>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${issue.priority === 'High' || issue.priority === 'Highest'
                                                            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50'
                                                            : issue.priority === 'Medium'
                                                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                                                                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                                                            }`}>
                                                            {issue.priority}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-slate-700 dark:text-slate-400 font-bold">
                                                        {getRelativeTime(issue.created)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/60">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">No detailed records found for this selection.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
