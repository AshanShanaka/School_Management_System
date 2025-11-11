// React DOM and Server Component Type Definitions

declare module 'react-dom' {
  // Export all existing react-dom functionality
  export * from 'react-dom';
  
  // Add useFormState compatibility
  export function useFormState<T>(
    action: (state: T, formData: FormData) => T | Promise<T>,
    initialState: T
  ): [T, (formData: FormData) => void];

  export function useFormStatus(): {
    pending: boolean;
    data: FormData | null;
    method: string | null;
    action: string | null;
  };

  // Server-side rendering
  export function renderToString(element: React.ReactElement): string;
  export function renderToStaticMarkup(element: React.ReactElement): string;
  export function renderToNodeStream(element: React.ReactElement): NodeJS.ReadableStream;
  export function renderToStaticNodeStream(element: React.ReactElement): NodeJS.ReadableStream;

  // Client-side rendering
  export function render(element: React.ReactElement, container: Element | DocumentFragment | null, callback?: () => void): void;
  export function hydrate(element: React.ReactElement, container: Element | DocumentFragment | null, callback?: () => void): void;
  export function unmountComponentAtNode(container: Element | DocumentFragment): boolean;

  // Modern React 18 APIs
  export function createRoot(container: Element | DocumentFragment, options?: {
    identifierPrefix?: string;
    onRecoverableError?: (error: any) => void;
  }): {
    render(children: React.ReactNode): void;
    unmount(): void;
  };

  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: React.ReactNode, options?: {
    identifierPrefix?: string;
    onRecoverableError?: (error: any) => void;
  }): {
    render(children: React.ReactNode): void;
    unmount(): void;
  };

  // Portal utilities
  export function createPortal(children: React.ReactNode, container: Element | DocumentFragment, key?: string | null): React.ReactPortal;

  // Performance utilities
  export function flushSync<T>(fn: () => T): T;
  export function unstable_batchedUpdates<T>(fn: () => T): T;

  // Legacy APIs (deprecated but might still be used)
  export function render(element: React.ReactElement, container: Element | null, callback?: () => void): React.Component<any, any> | Element | void;
  export function hydrate(element: React.ReactElement, container: Element | null, callback?: () => void): React.Component<any, any> | Element | void;
}

declare module 'react' {
  // React Server Components
  export interface ServerComponentProps {
    children?: React.ReactNode;
    [key: string]: any;
  }

  // Client Component marker
  export interface ClientComponentProps {
    children?: React.ReactNode;
    [key: string]: any;
  }

  // Async components for React Server Components
  export type AsyncComponent<P = {}> = (props: P) => Promise<React.ReactElement>;
  export type ServerComponent<P = {}> = (props: P) => React.ReactElement | Promise<React.ReactElement>;

  // useFormState compatibility
  export function useFormState<T>(
    action: (state: T, formData: FormData) => T | Promise<T>,
    initialState: T
  ): [T, (formData: FormData) => void];

  // Additional hooks that might be missing
  export function useDeferredValue<T>(value: T): T;
  export function useTransition(): [boolean, (callback: () => void) => void];
  export function useId(): string;
  export function useSyncExternalStore<T>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T
  ): T;

  // Suspense boundaries
  export interface SuspenseProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  // Error boundaries
  export interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
  }

  export class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{
      fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
      onError?: (error: Error, errorInfo: any) => void;
    }>,
    ErrorBoundaryState
  > {
    constructor(props: any);
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: any): void;
    resetError(): void;
    render(): React.ReactNode;
  }

  // Enhanced component types
  export type ComponentWithDisplayName<P = {}> = React.ComponentType<P> & {
    displayName?: string;
  };

  export type HOC<P = any, R = P> = (Component: React.ComponentType<P>) => React.ComponentType<R>;

  // Enhanced prop types
  export interface PropsWithClassName {
    className?: string;
  }

  export interface PropsWithStyle {
    style?: React.CSSProperties;
  }

  export interface PropsWithId {
    id?: string;
  }

  export interface PropsWithTestId {
    'data-testid'?: string;
  }

  export type PropsWithExtras<P = {}> = P & PropsWithClassName & PropsWithStyle & PropsWithId & PropsWithTestId;
}

// Additional type extensions for React ecosystem
declare global {
  namespace React {
    // JSX element types
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    // HTML attributes for all elements
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      accessKey?: string;
      className?: string;
      contentEditable?: Booleanish | 'inherit';
      contextMenu?: string;
      dir?: string;
      draggable?: Booleanish;
      hidden?: boolean;
      id?: string;
      lang?: string;
      slot?: string;
      spellCheck?: Booleanish;
      style?: CSSProperties;
      tabIndex?: number;
      title?: string;
      translate?: 'yes' | 'no';
      radioGroup?: string;
      role?: AriaRole;
      about?: string;
      datatype?: string;
      inlist?: any;
      prefix?: string;
      property?: string;
      resource?: string;
      typeof?: string;
      vocab?: string;
      autoCapitalize?: string;
      autoCorrect?: string;
      autoSave?: string;
      color?: string;
      itemProp?: string;
      itemRef?: string;
      itemType?: string;
      security?: string;
      unselectable?: 'on' | 'off';
      results?: number;
      autoComplete?: string;
    }
  }
}

export {};
