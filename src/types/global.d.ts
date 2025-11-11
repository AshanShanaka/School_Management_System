// Global type extensions and module augmentations

// Import the types we need
import { SchoolRole, UserData, FormState, TableColumn, SearchParams, PageProps } from '@/lib/utils';

// Make types available globally
declare global {
  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      NEXT_PUBLIC_APP_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }

  // Window object extensions
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    [key: string]: any;
  }

  // Common types available globally
  type Role = SchoolRole;
  type User = UserData;
  type FormActionState = FormState;
  type Column = TableColumn;
  type SearchQuery = SearchParams;
  type Props = PageProps;

  // React component types
  type ComponentProps<T = any> = {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  } & T;

  type FC<P = {}> = React.FunctionComponent<P>;
  type Component = React.ComponentType<any>;

  // Generic API response
  type APIResponse<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
  };

  // Generic list response
  type ListAPIResponse<T = any> = APIResponse<{
    items: T[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>;

  // Form data types
  type FormData = globalThis.FormData;
  
  // File types
  type FileList = globalThis.FileList;
  type File = globalThis.File;
  
  // Event types
  type Event = globalThis.Event;
  type MouseEvent = globalThis.MouseEvent;
  type KeyboardEvent = globalThis.KeyboardEvent;
  type ChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>;
  type FormEvent<T = HTMLFormElement> = React.FormEvent<T>;
  type SubmitEvent = Event & { submitter?: HTMLElement };

  // HTML Element types
  type HTMLElement = globalThis.HTMLElement;
  type HTMLInputElement = globalThis.HTMLInputElement;
  type HTMLSelectElement = globalThis.HTMLSelectElement;
  type HTMLTextAreaElement = globalThis.HTMLTextAreaElement;
  type HTMLFormElement = globalThis.HTMLFormElement;
  type HTMLButtonElement = globalThis.HTMLButtonElement;
  type HTMLDivElement = globalThis.HTMLDivElement;

  // Common utility types
  type ID = string | number;
  type Timestamp = Date | string;
  type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
  type JSONObject = { [key: string]: JSONValue };
  type JSONArray = JSONValue[];

  // Database types
  type DatabaseRecord = {
    id: ID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    [key: string]: any;
  };

  // Pagination types
  type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filter and search types
  type FilterValue = string | number | boolean | Date | null;
  type SortDirection = 'asc' | 'desc';
  type SortConfig = {
    field: string;
    direction: SortDirection;
  };

  // Status and state types
  type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
  };

  // Generic CRUD operations
  type CRUDOperation = 'create' | 'read' | 'update' | 'delete';
  type ActionType = 'create' | 'edit' | 'delete' | 'view';

  // Navigation and routing
  type Route = {
    path: string;
    component: React.ComponentType;
    exact?: boolean;
    roles?: Role[];
  };

  // Permission types
  type Permission = string;
  type PermissionCheck = (permission: Permission, user?: User) => boolean;

  // Theme and styling
  type ThemeMode = 'light' | 'dark' | 'system';
  type ColorScheme = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

  // Notification types
  type NotificationType = 'info' | 'success' | 'warning' | 'error';
  type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

  // File and media types
  type FileType = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
  type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'svg';
  type DocumentFormat = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt';

  // Date and time types
  type DateFormat = 'short' | 'medium' | 'long' | 'full';
  type TimeFormat = '12h' | '24h';

  // Validation types
  type ValidationRule = {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };

  type ValidationSchema = Record<string, ValidationRule>;
  type ValidationErrors = Record<string, string>;

  // Configuration types
  type AppConfig = {
    name: string;
    version: string;
    apiUrl: string;
    features: Record<string, boolean>;
    theme: {
      primary: string;
      secondary: string;
    };
  };

  // Analytics and tracking
  type EventData = Record<string, any>;
  type TrackingEvent = {
    name: string;
    data?: EventData;
    timestamp: Date;
  };

  // Internationalization
  type Locale = string;
  type TranslationKey = string;
  type Translations = Record<TranslationKey, string>;

  // Performance and optimization
  type LazyComponent<T = any> = React.LazyExoticComponent<React.ComponentType<T>>;
  type DeferredValue<T> = T;

  // Error handling
  type ErrorBoundaryFallback = React.ComponentType<{ error: Error; resetError: () => void }>;
  type ErrorInfo = {
    componentStack: string;
    errorBoundary?: string;
    errorInfo?: string;
  };

  // Context types
  type ContextValue<T> = T | undefined;
  type ProviderProps<T> = {
    children: React.ReactNode;
    value?: T;
  };

  // Hook types
  type UseStateHook<T> = [T, React.Dispatch<React.SetStateAction<T>>];
  type UseEffectCleanup = () => void;
  type UseEffectDeps = React.DependencyList;

  // Ref types
  type RefCallback<T> = (instance: T | null) => void;
  type RefObject<T> = React.RefObject<T>;

  // Event handler types
  type EventHandler<T = any> = (event: T) => void;
  type ClickHandler = EventHandler<React.MouseEvent>;
  type ChangeHandler<T = HTMLInputElement> = EventHandler<React.ChangeEvent<T>>;
  type SubmitHandler = EventHandler<React.FormEvent>;

  // Layout and positioning
  type Position = 'relative' | 'absolute' | 'fixed' | 'sticky';
  type Alignment = 'left' | 'center' | 'right' | 'justify';
  type Flex = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export {};
