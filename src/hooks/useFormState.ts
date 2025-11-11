import { useState, useCallback } from 'react';

// Define the form state type
export interface FormState {
  success: boolean;
  error: boolean;
  message?: string;
  hasDependencies?: boolean;
  dependencyCount?: number;
  dependencyDetails?: string;
  gradeLevel?: number;
}

// Define the form action type
export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

// Custom useFormState hook to replace the missing react-dom useFormState
export function useFormState(
  action: FormAction,
  initialState: FormState
): [FormState, (formData: FormData) => Promise<void>] {
  const [state, setState] = useState<FormState>(initialState);

  const dispatch = useCallback(
    async (formData: FormData) => {
      try {
        const newState = await action(state, formData);
        setState(newState);
      } catch (error) {
        setState({
          success: false,
          error: true,
          message: error instanceof Error ? error.message : 'An error occurred'
        });
      }
    },
    [action, state]
  );

  return [state, dispatch];
}

// Compatibility layer for existing usage patterns
export function useFormStateCompat<T>(
  action: (state: T, formData: any) => T | Promise<T>,
  initialState: T
): [T, (formData: any) => void] {
  const [state, setState] = useState<T>(initialState);

  const dispatch = useCallback(async (formData: any) => {
    try {
      const result = await action(state, formData);
      setState(result);
    } catch (error) {
      console.error('Form action error:', error);
    }
  }, [action, state]);

  return [state, dispatch];
}

export default useFormState;
