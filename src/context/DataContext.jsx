import { createContext, useContext, useState, useCallback } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [months, setMonths] = useState({});
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  const addMonth = useCallback((monthKey, records, budgetMap, bimokToBudget, bimokShort) => {
    setMonths(prev => ({
      ...prev,
      [monthKey]: { records, budgetMap, bimokToBudget, bimokShort, importedAt: new Date().toISOString() },
    }));
    setSelectedMonthKey(monthKey);
  }, []);

  const removeMonth = useCallback((monthKey) => {
    setMonths(prev => {
      const next = { ...prev };
      delete next[monthKey];
      return next;
    });
    setSelectedMonthKey(prev => {
      if (prev !== monthKey) return prev;
      const remaining = Object.keys(months).filter(k => k !== monthKey);
      return remaining.length > 0 ? remaining[remaining.length - 1] : "";
    });
  }, [months]);

  const selectMonth = useCallback((monthKey) => {
    setSelectedMonthKey(monthKey);
  }, []);

  const currentData = months[selectedMonthKey] || null;

  return (
    <DataContext.Provider value={{ months, selectedMonthKey, currentData, addMonth, removeMonth, selectMonth }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
