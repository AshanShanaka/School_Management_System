// Catch-all module declarations for TypeScript compatibility

// Third-party modules that might not have types
declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    [property: string]: any;
  }

  interface CookiesStatic {
    get(): { [key: string]: string };
    get(name: string): string | undefined;
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    withConverter(converter: { read?: (value: string, name: string) => string; write?: (value: string, name: string) => string }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export = Cookies;
}

declare module 'lodash' {
  export * from 'lodash';
}

declare module 'moment' {
  interface Moment {
    format(format?: string): string;
    add(amount?: number, unit?: string): Moment;
    subtract(amount?: number, unit?: string): Moment;
    [key: string]: any;
  }
  
  interface MomentStatic {
    (inp?: any, format?: any, strict?: boolean): Moment;
    (inp?: any, format?: any, language?: string, strict?: boolean): Moment;
    [key: string]: any;
  }
  
  const moment: MomentStatic;
  export = moment;
}

declare module 'chart.js' {
  export * from 'chart.js/auto';
}

declare module 'recharts' {
  export interface ChartData {
    [key: string]: any;
  }
  
  export interface ChartProps {
    data?: ChartData[];
    width?: number;
    height?: number;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export const AreaChart: React.ComponentType<ChartProps>;
  export const BarChart: React.ComponentType<ChartProps>;
  export const LineChart: React.ComponentType<ChartProps>;
  export const PieChart: React.ComponentType<ChartProps>;
  export const ScatterChart: React.ComponentType<ChartProps>;
  export const Area: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const ResponsiveContainer: React.ComponentType<any>;
}

declare module 'react-big-calendar' {
  export interface Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    [key: string]: any;
  }
  
  export interface CalendarProps {
    events: Event[];
    startAccessor?: string | ((event: Event) => Date);
    endAccessor?: string | ((event: Event) => Date);
    titleAccessor?: string | ((event: Event) => string);
    allDayAccessor?: string | ((event: Event) => boolean);
    resourceAccessor?: string | ((event: Event) => any);
    view?: 'month' | 'week' | 'work_week' | 'day' | 'agenda';
    defaultView?: 'month' | 'week' | 'work_week' | 'day' | 'agenda';
    views?: string[] | { [key: string]: any };
    date?: Date;
    defaultDate?: Date;
    onNavigate?: (date: Date, view: string) => void;
    onView?: (view: string) => void;
    onSelectEvent?: (event: Event) => void;
    onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void;
    selectable?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export const Calendar: React.ComponentType<CalendarProps>;
  export const momentLocalizer: (moment: any) => any;
  export const dateFnsLocalizer: (config: any) => any;
}

declare module 'react-calendar' {
  export interface CalendarProps {
    value?: Date | Date[];
    onChange?: (value: Date | Date[]) => void;
    onClickDay?: (value: Date) => void;
    onClickMonth?: (value: Date) => void;
    onClickYear?: (value: Date) => void;
    onClickDecade?: (value: Date) => void;
    view?: 'month' | 'year' | 'decade' | 'century';
    activeStartDate?: Date;
    defaultActiveStartDate?: Date;
    defaultValue?: Date | Date[];
    defaultView?: 'month' | 'year' | 'decade' | 'century';
    minDate?: Date;
    maxDate?: Date;
    minDetail?: 'month' | 'year' | 'decade' | 'century';
    maxDetail?: 'month' | 'year' | 'decade' | 'century';
    locale?: string;
    navigationLabel?: (props: { date: Date; view: string; label: string }) => React.ReactNode;
    nextLabel?: React.ReactNode;
    prevLabel?: React.ReactNode;
    next2Label?: React.ReactNode;
    prev2Label?: React.ReactNode;
    showNeighboringMonth?: boolean;
    showFixedNumberOfWeeks?: boolean;
    showNavigation?: boolean;
    showDoubleView?: boolean;
    selectRange?: boolean;
    returnValue?: 'start' | 'end' | 'range';
    className?: string | string[];
    calendarType?: 'arabic' | 'hebrew' | 'iso8601' | 'islamic' | 'gregory';
    formatDay?: (locale: string, date: Date) => string;
    formatLongDate?: (locale: string, date: Date) => string;
    formatMonth?: (locale: string, date: Date) => string;
    formatMonthYear?: (locale: string, date: Date) => string;
    formatShortWeekday?: (locale: string, date: Date) => string;
    formatYear?: (locale: string, date: Date) => string;
    tileClassName?: string | string[] | ((props: { date: Date; view: string }) => string | string[] | null);
    tileContent?: React.ReactNode | ((props: { date: Date; view: string }) => React.ReactNode);
    tileDisabled?: (props: { date: Date; view: string }) => boolean;
    [key: string]: any;
  }
  
  export default React.ComponentType<CalendarProps>;
}

// CSS Modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Image and asset modules
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

// Font modules
declare module '*.woff' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.eot' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.otf' {
  const src: string;
  export default src;
}

// JSON modules
declare module '*.json' {
  const value: any;
  export default value;
}

// Text modules
declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}

// Video and audio modules
declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

declare module '*.flac' {
  const src: string;
  export default src;
}

declare module '*.aac' {
  const src: string;
  export default src;
}

// Generic module fallback
declare module '*' {
  const content: any;
  export default content;
}

// Environment and build-time constants
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __TEST__: boolean;
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  };
  browser?: boolean;
  [key: string]: any;
};

// Global utilities that might be used
declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout;
declare function clearInterval(intervalId: NodeJS.Timeout): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;
declare function clearImmediate(immediateId: NodeJS.Immediate): void;

// Fetch API (in case it's not available)
declare function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;

export {};
