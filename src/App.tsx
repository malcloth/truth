import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import ShallPass from './pages/shallpass';
import YoyoHi from './pages/yoyohi';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/buddy" element={<ShallPass />} />
        <Route 
          path="/bruhxyz123truthhi" 
          element={
            <ProtectedRoute>
              <YoyoHi />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;