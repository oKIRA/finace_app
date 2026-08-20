import React, { createContext, useContext, useState } from 'react';

interface DateFilterContextType {
  selectedYear: number;
  selectedMonth: number; // 1 - 12
  setSelectedPeriod: (year: number, month: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  periodString: string; // YYYY-MM
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to August 2026 as user specified starting point
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // 8 = Agosto

  const setSelectedPeriod = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(Math.max(1, Math.min(12, month)));
  };

  const setYear = (year: number) => setSelectedYear(year);
  const setMonth = (month: number) => setSelectedMonth(Math.max(1, Math.min(12, month)));

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const periodString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  return (
    <DateFilterContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setSelectedPeriod,
        nextMonth,
        prevMonth,
        setYear,
        setMonth,
        periodString,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};
