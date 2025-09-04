import { useState, useEffect, useCallback } from 'react';

interface UseAzureDataReturn<T> {
  data: T;
  setData: (newData: T) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Simple localStorage fallback for development when API isn't available
function getLocalStorageValue<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalStorageValue<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

// Custom hook to replace useKV with Azure Functions API
export function useAzureData<T>(
  key: string,
  defaultValue: T,
  userId: string = 'default'
): [T, (newData: T) => Promise<void>, boolean] {
  const [data, setLocalData] = useState<T>(() => {
    // Initialize with localStorage value for immediate UI update
    return getLocalStorageValue(key, defaultValue);
  });
  const [loading, setLoading] = useState(false); // Start as false for better UX
  const [error, setError] = useState<string | null>(null);
  const [hasTriedApi, setHasTriedApi] = useState(false); // Prevent repeated API calls

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  // Load data from Azure Functions API
  const loadData = useCallback(async () => {
    if (hasTriedApi) return; // Prevent repeated attempts
    
    try {
      setLoading(true);
      setError(null);
      setHasTriedApi(true);
      
      const response = await fetch(`${apiBaseUrl}/data/${encodeURIComponent(key)}?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.value !== null) {
        setLocalData(result.value);
        setLocalStorageValue(key, result.value); // Cache locally
      } else {
        setLocalData(defaultValue);
      }
    } catch (err) {
      console.warn('API not available, using localStorage fallback:', err);
      // Fallback to localStorage when API is not available
      const fallbackValue = getLocalStorageValue(key, defaultValue);
      setLocalData(fallbackValue);
      setError(null); // Don't show error for development
    } finally {
      setLoading(false);
    }
  }, [key, userId, defaultValue, apiBaseUrl, hasTriedApi]);

  // Save data to Azure Functions API
  const saveData = useCallback(async (newData: T) => {
    try {
      setError(null);
      
      // Optimistically update local state
      setLocalData(newData);
      setLocalStorageValue(key, newData);
      
      const response = await fetch(`${apiBaseUrl}/data/${encodeURIComponent(key)}?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newData }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to save data');
      }
    } catch (err) {
      console.warn('API not available, data saved locally:', err);
      // In development/offline mode, just keep the local state
      // The data is already saved to localStorage above
    }
  }, [key, userId, apiBaseUrl]);

  // Load data on mount (only if not in localStorage already)
  useEffect(() => {
    // Only load from API if we haven't tried yet and don't have meaningful data
    const currentValue = getLocalStorageValue(key, defaultValue);
    if (!hasTriedApi && JSON.stringify(currentValue) === JSON.stringify(defaultValue)) {
      loadData();
    }
  }, [key, defaultValue, hasTriedApi]); // Removed loadData dependency to prevent loops

  return [data, saveData, loading];
}

// Simplified interface that matches useKV pattern
export function useKV<T>(key: string, defaultValue: T, userId?: string): [T, (newData: T | ((prev: T) => T)) => void] {
  const [data, setData, loading] = useAzureData(key, defaultValue, userId);
  
  const setDataWrapper = useCallback((newData: T | ((prev: T) => T)) => {
    if (typeof newData === 'function') {
      // Handle function updates like React setState
      const updater = newData as (prev: T) => T;
      const newValue = updater(data);
      console.log('useKV function update:', { key, oldValue: data, newValue });
      setData(newValue).catch(console.error);
    } else {
      // Handle direct value updates
      console.log('useKV direct update:', { key, newValue: newData });
      setData(newData).catch(console.error);
    }
  }, [setData, data, key]);
  
  return [data, setDataWrapper];
}