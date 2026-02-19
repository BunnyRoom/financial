import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Snapshots from './pages/Snapshots';
import Members from './pages/Members';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');

  const pages = {
    dashboard: <Dashboard />,
    transactions: <Transactions />,
    snapshots: <Snapshots />,
    members: <Members />,
    categories: <Categories />,
    settings: <Settings />,
  };

  return (
    <AppProvider>
      <div className="app-shell">
        <Sidebar page={page} setPage={setPage} />
        <main className="app-main">
          <div className="app-content">
            {pages[page] || <Dashboard />}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
