import { useEffect } from 'react';

// Pages
import { CalculatorPage } from '@/pages/calculator/CalculatorPage';

// Components
import { ThemeProvider } from '@/components/ThemeProvider';

// Stores
import { useUIStore } from '@/stores/ui-store';

function App() {
  const { loadPreferences } = useUIStore();

  // Initialize app on mount
  useEffect(() => {
    // Load user preferences
    loadPreferences();
  }, [loadPreferences]);

  return (
    <ThemeProvider>
      <CalculatorPage />
    </ThemeProvider>
  );
}

export default App;
