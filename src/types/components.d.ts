// Component prop types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TableProps {
  columns: TableColumn[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  count?: number;
}

export interface PaginationProps {
  page: number;
  count: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface FormContainerProps {
  table: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  id?: string | number;
}

export interface FormModalProps {
  table: string;
  type: 'create' | 'update' | 'delete';
  data?: any;
  id?: string | number;
  relatedData?: any;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  message?: string;
}

// Form action types
export interface ActionResult {
  success: boolean;
  error: boolean;
  message?: string;
}

// Chart data types
export interface ChartData {
  name: string;
  count: number;
  fill?: string;
}

export interface AttendanceChartData {
  name: string;
  present: number;
  absent: number;
}

export interface FinanceChartData {
  name: string;
  income: number;
  expense: number;
}

// Calendar event types
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  description?: string;
}

// User authentication types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: SchoolRole;
  name?: string;
  surname?: string;
  img?: string;
  [key: string]: any;
}

// Database query types
export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface WhereClause {
  [key: string]: any;
}

// File upload types
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  [key: string]: any;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: string;
}

// Menu and navigation types
export interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  visible?: boolean;
  onClick?: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// Dashboard widget types
export interface DashboardCard {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  color?: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  category?: string;
  [key: string]: any;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string[];
}

// Import/Export types
export interface ImportOptions {
  file: File;
  headers: string[];
  mapping: Record<string, string>;
  skipRows?: number;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  fields: string[];
  filters?: SearchFilters;
}

// Server action types
export type ServerAction<T = any> = (
  prevState: ActionResult,
  formData: FormData
) => Promise<ActionResult>;

// Additional utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Props for common components
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'danger';
}

// Date picker types
export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

// Layout types
export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  menuItems: MenuItem[];
}

export interface HeaderProps {
  title?: string;
  user?: AuthUser;
  onMenuToggle?: () => void;
  notifications?: Notification[];
}

// Data grid types
export interface DataGridColumn<T = any> {
  key: string;
  title: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface DataGridProps<T = any> {
  columns: DataGridColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedKeys: string[];
    onChange: (selectedKeys: string[]) => void;
  };
}

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
  placeholder?: string;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
}

export interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Common component ref types
export type ButtonRef = React.RefObject<HTMLButtonElement>;
export type InputRef = React.RefObject<HTMLInputElement>;
export type SelectRef = React.RefObject<HTMLSelectElement>;
export type TextareaRef = React.RefObject<HTMLTextAreaElement>;
