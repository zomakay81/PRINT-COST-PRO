import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [pointer, setPointer] = useState(0);

  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const resolvedState = typeof newState === 'function' ? (newState as any)(prev) : newState;

      const newHistory = history.slice(0, pointer + 1);
      newHistory.push(resolvedState);

      // Limit history size to 50 steps
      if (newHistory.length > 50) newHistory.shift();

      setHistory(newHistory);
      setPointer(newHistory.length - 1);

      return resolvedState;
    });
  }, [history, pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      const newPointer = pointer - 1;
      setPointer(newPointer);
      setState(history[newPointer]);
    }
  }, [history, pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      const newPointer = pointer + 1;
      setPointer(newPointer);
      setState(history[newPointer]);
    }
  }, [history, pointer]);

  return [state, set, undo, redo, pointer > 0, pointer < history.length - 1] as const;
}
