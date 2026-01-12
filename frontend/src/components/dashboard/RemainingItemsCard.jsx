import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../../config';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, ListTodo, Boxes } from 'lucide-react';

export const RemainingItemsCard = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/remaining-dev-items`);
            if (response.data.status === 'success') {
                setItems(response.data.items || []);
            }
        } catch (error) {
            console.error('Error fetching remaining items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 60000);
        return () => clearInterval(interval);
    }, []);

    // Helper to get initials from squad name in brackets
    const getSquadBadge = (text) => {
        const match = text.match(/\[(.*?)\]$/);
        if (!match) return { label: 'GEN', color: 'bg-slate-500' };

        const squad = match[1].toUpperCase();
        switch (squad) {
            case 'PCS': return { label: 'PCS', color: 'bg-amber-500' };
            case 'CLOUD': return { label: 'CLOUD', color: 'bg-emerald-500' };
            case 'APP': return { label: 'APP', color: 'bg-blue-500' };
            default: return { label: squad, color: 'bg-slate-500' };
        }
    };

    return (
        <Card className="flex-1 flex flex-col bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-300 group min-h-[200px]">
            <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.15em] flex items-center gap-2 text-rose-500">
                        <ListTodo className="h-4 w-4" />
                        Pending Development
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {items.length} Items
                        </span>
                        <div className="h-2 w-2 rounded-full bg-rose-500/50 animate-pulse" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                {loading && items.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                    </div>
                ) : items.length > 0 ? (
                    <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <AnimatePresence>
                            {items.map((item, idx) => {
                                const badge = getSquadBadge(item);
                                const cleanText = item.replace(/\s*\[.*?\]$/, '');

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50 transition-colors group/item"
                                    >
                                        <div className={`flex-none px-1.5 py-0.5 rounded text-[9px] font-black text-white ${badge.color} shadow-sm mt-0.5`}>
                                            {badge.label}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight group-hover/item:text-slate-900 dark:group-hover/item:text-slate-100 transition-colors">
                                            {cleanText}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                        <span className="text-[11px] font-bold uppercase tracking-wide">All Items In Development</span>
                    </div>
                )}

                {/* Gradient overlay for scroll indication */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />
            </CardContent>
        </Card>
    );
};
