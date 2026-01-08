import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Check, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PhaseProgress({ project, boardId, sprintId }) {
    const [phases, setPhases] = useState([]);

    useEffect(() => {
        if (!project) return;
        let url = `${API_URL}/api/dashboard/phase-status?project=${project}`;
        if (boardId) url += `&board_id=${boardId}`;
        if (sprintId) url += `&sprint_id=${sprintId}`;

        axios.get(url)
            .then(res => {
                if (Array.isArray(res.data)) {
                    setPhases(res.data);
                } else {
                    setPhases([]);
                }
            })
            .catch(err => {
                console.error(err);
                setPhases([]);
            });
    }, [project, boardId]);

    return (
        <Card className="h-full flex flex-col justify-center dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
            <CardContent className="pt-6">
                <div className="relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full z-0" />

                    {/* Active Progress Bar (Mocked to 65% for visual match) */}
                    <div className="absolute top-1/2 left-0 w-[65%] h-2 bg-blue-500 dark:bg-blue-600 -translate-y-1/2 rounded-full z-0 transition-all duration-1000 animate-particle-flow" />

                    <div className="relative z-10 flex justify-between">
                        {phases.map((phase, index) => (
                            <div
                                key={phase.name}
                                className="flex flex-col items-center group cursor-pointer"
                                onClick={() => window.open(`https://skyelectric.atlassian.net/issues/?jql=project=${project} AND status="${phase.name}"`, '_blank')}
                                title={`View ${phase.name} issues`}
                            >
                                <div className="mb-4 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors uppercase tracking-tight">{phase.name}</div>

                                {/* Status Circle */}
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-4 bg-white dark:bg-slate-900 transition-colors group-hover:ring-2 ring-blue-100 dark:ring-blue-900/30
                  ${phase.status === 'completed' ? 'border-emerald-500 dark:border-emerald-400 text-emerald-500 dark:border-emerald-400' : ''}
                  ${phase.status === 'in-progress' ? 'border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400' : ''}
                  ${phase.status === 'waiting' ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700' : ''}
                `}>
                                    {phase.status === 'completed' && <Check className="w-6 h-6 stroke-[3px]" />}
                                    {phase.status === 'in-progress' && <span className="text-xs font-black">{phase.count}</span>}
                                    {phase.status === 'waiting' && <Clock className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                                </div>

                                <div className="mt-2 text-[9px] text-muted-foreground dark:text-slate-500 uppercase font-black tracking-widest">
                                    {phase.status === 'completed' ? 'DONE' :
                                        phase.status === 'in-progress' ? 'ACTIVE' : 'IDLE'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
