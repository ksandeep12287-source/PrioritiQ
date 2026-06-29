import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity, CheckSquare, Trash2, Plus, LayoutDashboard,
  Settings, AlertCircle, BarChart3, Layers, Mic, MicOff
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState(''); // ← YE ADD KAR
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // AGENT STATES - NAYA
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [agentReply, setAgentReply] = useState('Bolo, kya kaam hai?');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/tasks?t=${Date.now()}`);
      const json = await response.json();

      if (json.success) {
        console.log('Tasks loaded:', json.data);
        setTasks(json.data || []);
      } else {
        console.error('Backend error:', json.error);
        setTasks([]);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`/api/v1/health`);
        setBackendStatus(response.ok? 'connected' : 'disconnected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, [location.key]);

  // AGENT SPEECH SETUP - NAYA
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleAgentMessage(transcript);
    };

    recognitionRef.current.onend = () => setIsListening(false);
  }, []);

  // AGENT HANDLERS - NAYA
  const handleAgentMessage = async (text) => {
    if (!text.trim()) return;

    try {
      // AI ko current date bhej taaki "kal", "parso" samajh sake
      const today = new Date().toISOString();
      
      const res = await fetch('http://localhost:5001/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          sessionId,
          currentDate: today // ← YE ADD KAR
        })
      });

      const data = await res.json();
      setAgentReply(data.reply);
      speak(data.reply);

      if (data.status === 'complete' && data.task) {
        // AI se jo task mila usko direct POST kar
        await fetch('http://localhost:5001/api/v1/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.task) // ← deadline already hoga isme
        });
        fetchTasks(); // Calendar refresh ho jayega
      }
    } catch (err) {
      setAgentReply('Error ho gaya');
    }
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const toggleAgent = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    console.log('1. Enqueue button clicked');

    if (!taskTitle.trim()) {
      alert('Task name daal bhai');
      return;
    }

    try {
      console.log('2. Calling POST /api/v1/tasks');

      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: taskTitle.trim(), 
          priority: taskPriority || 'medium', 
          deadline: taskDeadline || null, // ← YE LINE ADD KAR
          description: '',
          status: 'pending'
        })
      });
     
      const json = await response.json();
      console.log('3. Backend response:', json, 'Status:', response.status);

      if (!json.success) throw new Error(json.error || 'Failed to add task');

      const newTask = json.data;
      console.log('4. Adding to UI:', newTask);

      setTasks(prev => [newTask,...prev]);
      setTaskTitle('');
      setTaskPriority('medium');
      setTaskDeadline(''); // ← YE BHI ADD KAR

    } catch (error) {
      console.error('5. FAILED:', error);
      alert('Error: ' + error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`/api/v1/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setTasks(tasks.filter(task => task._id!== id && task.id!== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityA = a.priority || 'medium';
    const priorityB = b.priority || 'medium';
    const weightDiff = priorityWeight[priorityB] - priorityWeight[priorityA];
    if (weightDiff!== 0) return weightDiff;
    const dateA = a.createdAt? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  const totalTasks = tasks.length;
  const highCount = tasks.filter(t => (t.priority || 'medium') === 'high').length;
  const mediumCount = tasks.filter(t => (t.priority || 'medium') === 'medium').length;
  const lowCount = tasks.filter(t => (t.priority || 'medium') === 'low').length;

  // CALENDAR LOGIC - Phase 6.5
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.deadline) return acc;
    const dateKey = new Date(task.deadline).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {});

  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#ef4444';
    if (priority === 'medium') return '#eab308';
    return '#22c55e';
  };

  const selectedDateTasks = tasksByDate[selectedDate.toDateString()] || [];

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayTasks = tasksByDate[date.toDateString()];
      if (dayTasks?.length) {
        const order = { high: 3, medium: 2, low: 1 };
        const highest = dayTasks.reduce((a, b) =>
          order[b.priority] > order[a.priority]? b : a
        );
        return <div className="priority-dot" style={{ backgroundColor: getPriorityColor(highest.priority) }} />;
      }
    }
    return null;
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Layers size={20} /></div>
          <span className="brand-name">PrioritiQ</span>
        </div>

        <nav className="menu-section">
          <div
            className={`menu-item ${activeTab === 'dashboard'? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'create'? 'active' : ''}`}
            onClick={() => navigate('/create-task')}
          >
            <Plus size={18} />
            <span>Voice Task</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'analytics'? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} />
            <span>Insights</span>
          </div>
          <div
            className={`menu-item ${activeTab === 'settings'? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-card">
            <div className="connection-info">
              <span className="connection-title">API Status</span>
              <span className="connection-status">
                <span className={`pulse-dot ${backendStatus === 'connected'? 'connected' : 'disconnected'}`}></span>
                {backendStatus === 'connected'? 'Online' : backendStatus === 'checking'? 'Checking...' : 'Offline'}
              </span>
            </div>
            <Activity size={16} className={backendStatus === 'connected'? 'text-success' : 'text-danger'} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <h1 className="page-title">
            {activeTab === 'dashboard' && 'Task Dashboard'}
            {activeTab === 'analytics' && 'Performance Insights'}
            {activeTab === 'settings' && 'System Settings'}
          </h1>
          <div className="user-profile">
            <div className="profile-avatar">PQ</div>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'dashboard' && (
            <>
              {/* AGENTIC AI CARD - NAYA */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{margin: 0, fontSize: '18px'}}>PrioritiQ Agent</h3>
                    <p style={{margin: '4px 0 0', opacity: 0.9, fontSize: '14px'}}>{agentReply}</p>
                  </div>
                  <button onClick={toggleAgent} style={{
                    background: isListening? '#ef4444' : 'white',
                    color: isListening? 'white' : '#667eea',
                    border: 'none', padding: '12px 24px', borderRadius: '12px',
                    fontWeight: '700', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: '8px'
                  }}>
                    {isListening? <MicOff size={20}/> : <Mic size={20}/>}
                    {isListening? 'Stop' : 'Speak'}
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Queue Size</h3>
                    <div className="stat-value">{totalTasks}</div>
                  </div>
                  <div className="stat-icon purple"><Layers size={22} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>High Priority</h3>
                    <div className="stat-value">{highCount}</div>
                  </div>
                  <div className="stat-icon red"><AlertCircle size={22} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Medium Priority</h3>
                    <div className="stat-value">{mediumCount}</div>
                  </div>
                  <div className="stat-icon yellow"><Activity size={22} /></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Low Priority</h3>
                    <div className="stat-value">{lowCount}</div>
                  </div>
                  <div className="stat-icon green"><CheckSquare size={22} /></div>
                </div>
              </div>

              {/* CALENDAR SECTION - Phase 6.5 */}
              <div className="dashboard-grid">
                <div className="panel-card">
                  <div className="panel-header">
                    <h2 className="panel-title">Task Calendar</h2>
                  </div>
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileContent={tileContent}
                    className="priority-calendar"
                  />
                  <div className="selected-date-tasks">
                    <h4>Tasks on {selectedDate.toDateString()}</h4>
                    {selectedDateTasks.length > 0? (
                      selectedDateTasks.map(task => (
                        <div key={task._id || task.id} className="task-item">
                          <div className="task-content">
                            <div className="task-title">{task.title}</div>
                            <div className="task-meta">
                              <span className={`priority-badge ${task.priority || 'medium'}`}>
                                {task.priority || 'medium'}
                              </span>
                              <span className="task-date">
                                {task.deadline? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                              </span>
                            </div>
                          </div>
                          {/* YE 5 LINES ADD KAR */}
                          <div className="task-actions">
                            <button
                              className="btn-icon-action delete"
                              onClick={() => deleteTask(task._id || task.id)}
                              title="Delete Task"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-tasks">No tasks scheduled</p>
                    )}
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <h2 className="panel-title">
                      <Plus size={18} />
                      Add Priority Task
                    </h2>
                  </div>

                  <form onSubmit={addTask}>
                    <div className="form-group">
                      <label htmlFor="task-title">Task Name</label>
                      <input
                        type="text"
                        id="task-title"
                        className="form-input"
                        placeholder="Define item or task description..."
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="task-priority">Task Priority Level</label>
                      <select
                        id="task-priority"
                        className="form-select"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                      >
                        <option value="high">🔥 High Priority</option>
                        <option value="medium">⚡ Medium Priority</option>
                        <option value="low">🌱 Low Priority</option>
                      </select>
                    </div>

                    {/* YE PURA BLOCK ADD KAR */}
                    <div className="form-group">
                      <label htmlFor="task-deadline">Deadline</label>
                      <input
                        type="datetime-local"
                        id="task-deadline"
                        className="form-input"
                        value={taskDeadline}
                        onChange={(e) => setTaskDeadline(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                      <Plus size={16} />
                      Enqueue Task
                    </button>
                  </form>
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h2 className="panel-title">
                    <CheckSquare size={18} />
                    Priority Queue Flow
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Auto-sorted: High → Med → Low
                  </span>
                </div>

                <div className="task-list">
                  {isLoading? (
                    <div className="empty-state">
                      <Activity className="empty-icon" />
                      <h3>Loading tasks...</h3>
                    </div>
                  ) : sortedTasks.length > 0? (
                    sortedTasks.map(task => (
                      <div key={task._id || task.id} className="task-item">
                        <div className="task-content">
                          <div className="task-title">{task.title}</div>
                          <div className="task-meta">
                            <span className={`priority-badge ${task.priority || 'medium'}`}>
                                {task.priority || 'medium'}
                            </span>
                            <span className="task-date">
                              {task.createdAt? new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                        </div>
                        <div className="task-actions">
                          <button
                            className="btn-icon-action delete"
                            onClick={() => deleteTask(task._id || task.id)}
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <CheckSquare className="empty-icon" />
                      <h3>Queue is empty</h3>
                      <p>Create tasks to prioritize workflow items.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="panel-card" style={{ padding: '32px', textAlign: 'center' }}>
              <BarChart3 size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
              <h2>PrioritiQ Insights</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Statistical analytics tracking throughput, task priority densities, and completion cycle times.
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="panel-card" style={{ padding: '32px', textAlign: 'center' }}>
              <Settings size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
              <h2>System Settings</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Configure webhook payloads, worker thresholds, and queue concurrency limits.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;