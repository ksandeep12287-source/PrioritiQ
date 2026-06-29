import './App.css';  // ← Ye line add kar top pe
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; // <-- Ye line add kar
import CreateTask from './pages/CreateTask';
import './App.css';

// Main App with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-task" element={<CreateTask />} />
      </Routes>
    </Router>
  );
}

export default App;