import { useState, useEffect } from 'react';

export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(new Date());
    };

    // Update immediately
    updateDate();

    // Update every minute to ensure date changes are caught
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  const today = currentDate.toISOString().split('T')[0];
  const todayDisplay = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = (dateString: string) => dateString === today;

  return {
    currentDate,
    today,
    todayDisplay,
    isToday
  };
}