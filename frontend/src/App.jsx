
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from './config';
import { OverallProgress } from './components/dashboard/OverallProgress';
import { SheetPieCharts } from './components/dashboard/SheetPieCharts';
import { BugMetricsChart } from './components/dashboard/BugMetricsChart';
import { TestCoverageCard } from './components/dashboard/TestCoverageCard';
import { SquadQualityCard } from './components/dashboard/SquadQualityCard';
import { RecentIssuesAndSeverity } from './components/dashboard/RecentIssuesAndSeverity';
import { DeveloperIssuesChart } from './components/dashboard/DeveloperIssuesChart';
import { BoardQualityChart } from './components/dashboard/BoardQualityChart';
import { BugAssignmentFlow } from './components/dashboard/BugAssignmentFlow';
import { SprintTimelineChart } from './components/dashboard/SprintTimelineChart';
import { Sun, Moon, LayoutDashboard, ListTodo, BarChart3, Radio, Server, Cloud, Smartphone, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [selectedProject] = useState("SSSS,JI");
  const [projectId, setProjectId] = useState("84742"); // Defaulting to SSSS project ID
  const [selectedBoard] = useState(null);
  const [selectedSprint] = useState(null);
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // We can still try to fetch the ID for SSSS to keep generic components working
    axios.get(`${API_URL}/api/project/SSSS/id`)
      .then(res => setProjectId(res.data.id))
      .catch(err => console.error("Failed to fetch project ID", err));

    return () => { };
  }, []);

  const tabs = [
    // { id: 'overview', label: 'Squad Overview', icon: <LayoutDashboard size={14} /> },
    // { id: 'issues', label: 'Tracability & Issues', icon: <ListTodo size={14} /> },
    // { id: 'analytics', label: 'Quality Analytics', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="h-screen max-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Header: Enhanced for v2 */}
      <header className="flex-none px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm">
        <div className="flex items-center flex-1 min-w-0">
          <div className="relative w-full">
            <h1 className="text-[clamp(1.5rem,5cqi,2.5rem)] font-black bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent tracking-tighter uppercase italic whitespace-nowrap leading-tight w-full">
              Quality Excellence Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <p className="text-[clamp(10px,1cqi,14px)] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest">
                LIVE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Filters removed as per consolidation request */}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid - Dynamically Rendered based on Tabs */}
      <main className="flex-1 overflow-hidden p-6">

        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-2">

            {/* Row 1: Compliance & Stability */}
            <div className="grid grid-cols-12 gap-6 flex-none">
              <div className="col-span-12 lg:col-span-3">
                <OverallProgress project={selectedProject} sprintId={selectedSprint} />
              </div>
              <div className="col-span-12 lg:col-span-9">
                <SheetPieCharts />
              </div>
            </div>

            {/* Row 2: Test Coverage & Squad Quality */}
            <div className="grid grid-cols-12 gap-6 flex-none mb-6">
              <div className="col-span-12 lg:col-span-3">
                <TestCoverageCard />
              </div>
              <div className="col-span-12 lg:col-span-3">
                <SquadQualityCard squadName="PCS" colorClass="text-amber-500" icon={Server} />
              </div>
              <div className="col-span-12 lg:col-span-3">
                <SquadQualityCard squadName="Cloud" colorClass="text-emerald-500" icon={Cloud} />
              </div>
              <div className="col-span-12 lg:col-span-3">
                <SquadQualityCard squadName="APP" colorClass="text-blue-500" icon={Smartphone} />
              </div>
            </div>

            {/* Row 3: Secondary Insights */}
            <div className="grid grid-cols-12 gap-6 flex-none mb-6">
              <div className="col-span-12 lg:col-span-8">
                <DeveloperIssuesChart project={selectedProject} sprintId={selectedSprint} />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <SprintTimelineChart />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="h-full overflow-hidden">
            {projectId ? (
              <RecentIssuesAndSeverity
                projectId={projectId}
                projectKey={selectedProject}
                boardId={selectedBoard}
                sprintId={selectedSprint}
                compact={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 animate-pulse">Initializing Data Stream...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
            <div className="col-span-12 lg:col-span-6 h-full flex flex-col gap-6">
              <div className="flex-1">
                {projectId && <BoardQualityChart projectId={projectId} />}
              </div>
              <div className="h-[300px]">
                <BugMetricsChart />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 h-full">
              {projectId && (
                <BugAssignmentFlow
                  projectId={projectId}
                  projectKey={selectedProject}
                  defaultView="flow"
                  hideToggle={false}
                />
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App

