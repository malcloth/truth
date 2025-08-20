import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ShallPass from './pages/shallpass';
import YoyoHi from './pages/yoyohi';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
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