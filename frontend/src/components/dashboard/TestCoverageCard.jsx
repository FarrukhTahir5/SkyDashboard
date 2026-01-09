
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Loader2, AlertCircle, ClipboardCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TestCoverageCard = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/test-coverage`);
            if (response.data.status === 'success') {
                setData(response.data.data);
                setError(null);
            } else {
                setError(response.data.error || 'Failed to fetch');
            }
        } catch (err) {
            console.error('Error fetching test coverage:', err);
            if (!isSilent) setError('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && data.length === 0) {
        return (
            <Card className="h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 rounded-3xl min-h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </Card>
        );
    }

    const parsePercent = (val) => {
        if (!val) return 0;
        return parseFloat(val.toString().replace('%', '')) || 0;
    };

    const ProgressMini = ({ value, colorClass }) => {
        const roundedValue = parsePercent(value).toFixed(0) + '%';
        return (
            <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center px-0.5">
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{roundedValue}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${parsePercent(value)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${colorClass} shadow-sm`}
                    />
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl flex flex-col hover:shadow-2xl transition-all duration-300">
            <CardHeader className="py-3 px-6 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                        Test Coverage Status
                    </CardTitle>
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                        <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Live Scan</span>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-around pb-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">PCS</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">CLOUD</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">APP</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                    <AnimatePresence>
                        {data.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="group flex flex-col gap-1.5 bg-white/40 dark:bg-slate-800/20 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-800/40 transition-all duration-200"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-[16px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                                        {item.test_type}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <ProgressMini value={item.pcs} colorClass="bg-amber-500" />
                                    <ProgressMini value={item.cloud} colorClass="bg-emerald-500" />
                                    <ProgressMini value={item.app} colorClass="bg-blue-500" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
};
