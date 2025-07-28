/**
 * BMad - UI Types
 * TypeScript interfaces for UI components and interactions
 */

import { ComponentChildren } from 'preact';

// Base component props
export interface BaseComponentProps {
  class?: string;
  id?: string;
  children?: ComponentChildren;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Button component props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: Event) => void;
  type?: 'button' | 'submit' | 'reset';
  icon?: string;
  iconPosition?: 'left' | 'right';
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

// Alert/Toast component props
export interface AlertProps extends BaseComponentProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number; // Auto-dismiss time in ms
  onDismiss?: () => void;
  persistent?: boolean; // Don't auto-dismiss
  icon?: boolean;
}

// Form field props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
}

// Input component props
export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'url';
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  readOnly?: boolean;
}

// Select component props
export interface SelectProps extends FormFieldProps {
  options: SelectOption[];
  placeholder?: string;
  multiple?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Card component props
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  actions?: CardAction[];
  clickable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  disabled?: boolean;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: string;
  active?: boolean;
  disabled?: boolean;
  children?: NavItem[];
}

// Table component types
export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ComponentChildren;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = unknown> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

// Pagination types
export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  message?: string;
}

// Form validation
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// QR Scanner specific types
export interface QRScannerProps extends BaseComponentProps {
  onScan: (result: string) => void;
  onError: (error: string) => void;
  onPermissionDenied: () => void;
  isActive: boolean;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  showViewfinder?: boolean;
  scanDelay?: number; // Milliseconds between scans
}

// Camera controls
export interface CameraControlsProps extends BaseComponentProps {
  isActive: boolean;
  facingMode: 'user' | 'environment';
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onClose: () => void;
  hasFlashlight?: boolean;
  flashlightOn?: boolean;
  onToggleFlashlight?: () => void;
}

// Medication display types
export interface MedicationCardProps extends BaseComponentProps {
  medication: {
    id: string;
    name: string;
    dosage: string;
    form: string;
    nextDose?: Date;
    status?: 'due' | 'taken' | 'missed' | 'upcoming';
  };
  onTakeDose?: (medicationId: string) => void;
  onViewDetails?: (medicationId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// Calendar/Schedule types
export interface CalendarProps extends BaseComponentProps {
  date: Date;
  medications: Array<{
    id: string;
    name: string;
    time: string;
    status: 'due' | 'taken' | 'missed' | 'upcoming';
    dosage: string;
  }>;
  onDateChange: (date: Date) => void;
  onMedicationClick: (medicationId: string) => void;
  view?: 'day' | 'week' | 'month';
}

// Notification types for seniors
export interface NotificationProps extends BaseComponentProps {
  title: string;
  message: string;
  type: 'medication' | 'reminder' | 'warning' | 'success' | 'info';
  time?: Date;
  urgent?: boolean;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  showTime?: boolean;
  largeTouchTarget?: boolean;
}

// Accessibility helpers
export interface A11yProps {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  tabIndex?: number;
}

// Theme and styling
export interface ThemeContext {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  colorScheme: 'light' | 'dark' | 'auto';
}

// Touch and gesture types
export interface TouchTarget {
  minSize: number; // Minimum 44px for WCAG
  preferredSize: number; // 56px for comfortable use
}

// Error boundary types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

// Device capabilities
export interface DeviceCapabilities {
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasNotifications: boolean;
  isOnline: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportsWebRTC: boolean;
  supportsPWA: boolean;
}