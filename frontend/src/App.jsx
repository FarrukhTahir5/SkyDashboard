
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from './config';
import { OverallProgress } from './components/dashboard/OverallProgress';
import { PhaseProgress } from './components/dashboard/PhaseProgress';
import { RecentIssuesAndSeverity } from './components/dashboard/RecentIssuesAndSeverity';
import { DeveloperIssuesChart } from './components/dashboard/DeveloperIssuesChart';
import { BoardQualityChart } from './components/dashboard/BoardQualityChart';
import { BugAssignmentFlow } from './components/dashboard/BugAssignmentFlow';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("SKY");
  const [projectId, setProjectId] = useState(null);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

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
    // Fetch available projects
    axios.get(`${API_URL}/api/projects`)
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProjects(res.data);
          setSelectedProject(res.data[0].key);
        } else {
          setProjects([]);
        }
      })
      .catch(err => console.error("Failed to fetch projects", err));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      // Fetch project ID first
      axios.get(`${API_URL}/api/project/${selectedProject}/id`)
        .then(res => {
          setProjectId(res.data.id);
        })
        .catch(err => {
          console.error("Failed to fetch project ID", err);
          setProjectId(null);
        });

      // Fetch boards for project
      axios.get(`${API_URL}/api/boards?project=${selectedProject}`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setBoards(res.data);
            if (res.data.length > 0) {
              setSelectedBoard(res.data[0].id);
            } else {
              setSelectedBoard(null);
              setSprints([]);
              setSelectedSprint(null);
            }
          } else {
            setBoards([]);
            setSelectedBoard(null);
            setSprints([]);
            setSelectedSprint(null);
          }
        })
        .catch(err => {
          console.error("Failed to fetch boards", err);
          setBoards([]);
          setSelectedBoard(null);
        });
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedBoard) {
      // Fetch sprints for board
      axios.get(`${API_URL}/api/sprints?board_id=${selectedBoard}`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setSprints(res.data);
            // Auto-select active sprint if exists, else first
            const active = res.data.find(s => s.state === 'active');
            if (active) setSelectedSprint(active.id);
            else if (res.data.length > 0) setSelectedSprint(res.data[0].id);
            else setSelectedSprint(null);
          } else {
            setSprints([]);
            setSelectedSprint(null);
          }
        })
        .catch(err => {
          setSprints([]);
          setSelectedSprint(null);
        });
    } else {
      setSprints([]);
      setSelectedSprint(null);
    }
  }, [selectedBoard]);

  return (
    <div className="h-screen max-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* Header: Compact Fixed Height */}
      <header className="flex-none px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight uppercase">
              Project status quality assurance dashboard
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest mt-0.5">
              Real-time intelligence • <span className="text-blue-500 dark:text-blue-400">{selectedProject}</span> • Traceability
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Project:</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-md p-1.5 focus:ring-1 ring-blue-500 outline-none shadow-sm min-w-[80px]"
              >
                {projects.map((p) => (
                  <option key={p.key} value={p.key}>{p.key}</option>
                ))}
              </select>
            </div>

            {/* Board Selector */}
            {boards.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Board:</span>
                <select
                  value={selectedBoard || ''}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-md p-1.5 focus:ring-1 ring-blue-500 outline-none shadow-sm max-w-[120px] truncate"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sprint Selector */}
            {sprints.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Sprint:</span>
                <select
                  value={selectedSprint || ''}
                  onChange={(e) => setSelectedSprint(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-md p-1.5 focus:ring-1 ring-blue-500 outline-none shadow-sm max-w-[120px] truncate"
                >
                  <option value="">All Context</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 overflow-hidden p-4 grid grid-cols-12 gap-4">

        {/* LEFT COLUMN (8/12) */}
        <div className="col-span-8 flex flex-col gap-4 overflow-hidden h-full">

          {/* Row 1: Progress Metrics */}
          <div className="flex-[1.4] min-h-0 w-full overflow-hidden">
            <div className="grid grid-cols-4 gap-4 h-full">
              <div className="col-span-1 h-full">
                <OverallProgress project={selectedProject} sprintId={selectedSprint} />
              </div>
              <div className="col-span-3 h-full">
                <PhaseProgress project={selectedProject} boardId={selectedBoard} sprintId={selectedSprint} />
              </div>
            </div>
          </div>

          {/* Row 2: Operational Traceability */}
          <div className="flex-[2.3] min-h-0 w-full overflow-hidden relative z-0">
            {projectId && (
              <RecentIssuesAndSeverity
                projectId={projectId}
                projectKey={selectedProject}
                boardId={selectedBoard}
                sprintId={selectedSprint}
                compact={true}
              />
            )}
          </div>

          {/* Row 3: Resolution Timeliness */}
          <div className="flex-[2.3] min-h-0 w-full overflow-hidden relative z-0">
            {projectId && <BoardQualityChart projectId={projectId} />}
          </div>
        </div>

        {/* RIGHT COLUMN (4/12) - Linked Sidebar Metrics */}
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">

          {/* Defect Ownership (Flow) */}
          <div className="flex-1 min-h-0">
            {projectId && (
              <BugAssignmentFlow
                projectId={projectId}
                projectKey={selectedProject}
                defaultView="flow"
                hideToggle={false}
              />
            )}
          </div>

          {/* Resource Utilization */}
          <div className="flex-1 min-h-0">
            <DeveloperIssuesChart project={selectedProject} sprintId={selectedSprint} />
          </div>
        </div>

      </main>
    </div>
  )
}

export default App

