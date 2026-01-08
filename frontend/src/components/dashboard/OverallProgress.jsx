import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverallProgress({ project, sprintId }) {
    const [percentage, setPercentage] = useState(0);

    useEffect(() => {
        if (!project) return;
        let url = `${API_URL}/api/dashboard/progress?project=${project}`;
        if (sprintId) url += `&sprint_id=${sprintId}`;

        axios.get(url)
            .then(res => {
                if (typeof res.data === 'number') {
                    setPercentage(res.data);
                } else if (res.data && res.data.percentage !== undefined) {
                    setPercentage(res.data.percentage);
                } else {
                    setPercentage(0);
                }
            })
            .catch(err => {
                console.error(err);
                setPercentage(0);
            });
    }, [project, sprintId]);

    const data = [
        { name: 'Completed', value: percentage },
        { name: 'Remaining', value: 100 - percentage },
    ];
    const COLORS = ['#3b82f6', 'var(--muted)']; // Blue-500, Muted (theme-aware)

    return (
        <Card
            className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer dark:bg-slate-900/50 dark:border-slate-800"
            onClick={() => window.open(`https://skyelectric.atlassian.net/browse/${project}`, '_blank')}
            title="View Project"
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-200 text-center uppercase tracking-wide">
                    Execution Compliance
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={0}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                            <Label
                                value={`${percentage}%`}
                                position="center"
                                className="fill-primary text-2xl font-bold"
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
