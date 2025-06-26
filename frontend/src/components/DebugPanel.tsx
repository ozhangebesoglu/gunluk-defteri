import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DebugPanel: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const [dbStatus, setDbStatus] = useState<string>('Testing...');
  const [entriesCount, setEntriesCount] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    // Test Electron API availability
    if (window.electronAPI) {
      setApiStatus('✅ Electron API available');
      
      // Test database connection
      try {
        const healthResult = await window.electronAPI.db.healthCheck();
        setDbStatus(`✅ Database: ${JSON.stringify(healthResult)}`);
      } catch (error) {
        setDbStatus(`❌ Database error: ${error}`);
      }

      // Test entries
      try {
        const entries = await window.electronAPI.diary.getEntries();
        setEntriesCount(Array.isArray(entries) ? entries.length : 0);
      } catch (error) {
        console.error('Entries error:', error);
      }
    } else {
      setApiStatus('❌ Electron API not available - using localStorage');
      setDbStatus('❌ Database not available');
      const storedEntries = JSON.parse(localStorage.getItem('diary_entries') || '[]');
      setEntriesCount(storedEntries.length);
    }
  };

  const testNavigation = () => {
    console.log('🧪 Testing navigation...');
    navigate('/new-entry');
  };

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
      <div className="space-y-1">
        <div>{apiStatus}</div>
        <div>{dbStatus}</div>
        <div>📝 Entries: {entriesCount}</div>
        <div>🌐 URL: {window.location.href}</div>
        <div>🔗 Protocol: {window.location.protocol}</div>
        <div>📍 Route: {location.pathname}</div>
        <div>🔗 Hash: {location.hash}</div>
        <button 
          onClick={testNavigation}
          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
        >
          Test Navigate
        </button>
      </div>
    </div>
  );
};

export default DebugPanel; 