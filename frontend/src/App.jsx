import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BudgetFlow from './pages/BudgetFlow';
import Analytics from './pages/Analytics';
import AnomalyDetection from './pages/AnomalyDetection';
import BudgetVerification from './pages/BudgetVerification';
import GeospatialView from './pages/GeospatialView';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="budget-flow" element={<BudgetFlow />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="anomalies" element={<AnomalyDetection />} />
        <Route path="verification" element={<BudgetVerification />} />
        <Route path="map" element={<GeospatialView />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
