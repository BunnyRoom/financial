import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { transactionAPI, snapshotAPI, memberAPI, categoryAPI, settingsAPI } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [txn, snap, mem, cat, set, sum] = await Promise.all([
        transactionAPI.getAll(),
        snapshotAPI.getAll(),
        memberAPI.getAll(),
        categoryAPI.getAll(),
        settingsAPI.get(),
        transactionAPI.getSummary(),
      ]);
      setTransactions(txn.data.data);
      setSnapshots(snap.data.data);
      setMembers(mem.data.data);
      setCategories(cat.data.data);
      setSettings(set.data.data);
      setSummary(sum.data.data);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshSummary = async () => {
    const sum = await transactionAPI.getSummary();
    setSummary(sum.data.data);
  };

  return (
    <AppContext.Provider value={{
      transactions, snapshots, members, categories, settings, summary, loading,
      loadAll, refreshSummary,
      setTransactions, setSnapshots, setMembers, setCategories, setSettings, setSummary
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
