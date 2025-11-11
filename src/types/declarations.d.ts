// Override Next.js Module Declarations to fix implicit any errors
declare module 'next/image' {
  import React from 'react';
  
  interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number | `${number}`;
    height?: number | `${number}`;
    className?: string;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    fill?: boolean;
    sizes?: string;
    style?: React.CSSProperties;
    quality?: number;
    loader?: (props: { src: string; width: number; quality?: number }) => string;
    unoptimized?: boolean;
    onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onLoadingComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
    [key: string]: any;
  }
  
  declare const Image: React.ForwardRefExoticComponent<
    ImageProps & React.RefAttributes<HTMLImageElement>
  >;
  export default Image;
}

declare module 'next/link' {
  import { ComponentType, ReactNode } from 'react';
  interface LinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    [key: string]: any;
  }
  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push: (path: string) => void;
    replace: (path: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
    prefetch: (href: string) => void;
    [key: string]: any;
  };
  
  export function useSearchParams(): {
    get: (name: string) => string | null;
    getAll: (name: string) => string[];
    has: (name: string) => boolean;
    keys: () => IterableIterator<string>;
    values: () => IterableIterator<string>;
    entries: () => IterableIterator<[string, string]>;
    [Symbol.iterator]: () => IterableIterator<[string, string]>;
    toString: () => string;
  };
  
  export function usePathname(): string;
  export function useParams(): { [key: string]: string | string[] };
  export function redirect(path: string): never;
  export function notFound(): never;
  export function permanentRedirect(path: string): never;
}

declare module 'next/server' {
  export interface NextRequest extends Request {
    nextUrl: {
      pathname: string;
      search: string;
      searchParams: URLSearchParams;
      href: string;
      origin: string;
      [key: string]: any;
    };
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined;
      getAll: () => { name: string; value: string }[];
      set: (name: string, value: string, options?: any) => void;
      delete: (name: string) => void;
      [key: string]: any;
    };
    headers: Headers;
    [key: string]: any;
  }
  
  export class NextResponse extends Response {
    static json(data: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(url: string | URL): NextResponse;
    static next(): NextResponse;
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined;
      getAll: () => { name: string; value: string }[];
      set: (name: string, value: string, options?: any) => void;
      delete: (name: string) => void;
      [key: string]: any;
    };
    [key: string]: any;
  }
}

declare module 'next/dynamic' {
  import { ComponentType } from 'react';
  interface DynamicOptions {
    loading?: ComponentType<any>;
    ssr?: boolean;
    suspense?: boolean;
  }
  function dynamic<T = {}>(
    dynamicOptions: () => Promise<{ default: ComponentType<T> }>,
    options?: DynamicOptions
  ): ComponentType<T>;
  export default dynamic;
}

declare module 'next/font/google' {
  interface FontDisplay {
    className: string;
    variable?: string;
    style: Record<string, any>;
  }
  
  interface FontFunction {
    (options: {
      subsets: string[];
      weight?: string | string[];
      variable?: string;
      display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
      preload?: boolean;
      fallback?: string[];
      adjustFontFallback?: boolean;
      [key: string]: any;
    }): FontDisplay;
  }
  
  export const Inter: FontFunction;
  export const Roboto: FontFunction;
  export const Open_Sans: FontFunction;
  export const Lato: FontFunction;
  export const Montserrat: FontFunction;
  export const Oswald: FontFunction;
  export const Source_Sans_Pro: FontFunction;
  export const Slabo_27px: FontFunction;
  export const Raleway: FontFunction;
  export const PT_Sans: FontFunction;
  [key: string]: FontFunction;
}

declare module 'next/cache' {
  export function revalidatePath(path: string, type?: 'layout' | 'page'): void;
  export function revalidateTag(tag: string): void;
  export function unstable_cache<T extends (...args: any[]) => any>(
    fn: T,
    keyParts?: string[],
    options?: { 
      revalidate?: number | false; 
      tags?: string[];
    }
  ): T;
  export function unstable_noStore(): void;
}

declare module 'next' {
  export interface NextConfig {
    experimental?: Record<string, any>;
    images?: Record<string, any>;
    env?: Record<string, string>;
    publicRuntimeConfig?: Record<string, any>;
    serverRuntimeConfig?: Record<string, any>;
    [key: string]: any;
  }
  
  export interface Metadata {
    title?: string | { default: string; template?: string };
    description?: string;
    keywords?: string | string[];
    authors?: Array<{ name: string; url?: string }>;
    creator?: string;
    publisher?: string;
    robots?: string | { index?: boolean; follow?: boolean };
    [key: string]: any;
  }
}

// Prisma Client Declaration
declare module '@prisma/client' {
  export interface PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number>;
    $executeRawUnsafe(query: string, ...values: any[]): Promise<number>;
    $queryRaw(query: TemplateStringsArray, ...values: any[]): Promise<any>;
    $queryRawUnsafe(query: string, ...values: any[]): Promise<any>;
    $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
    $transaction<T extends any[]>(queries: [...T]): Promise<T>;
    [key: string]: any;
  }
  
  export class PrismaClient {
    constructor(options?: {
      datasources?: { db?: { url?: string } };
      log?: Array<'query' | 'info' | 'warn' | 'error'>;
      errorFormat?: 'pretty' | 'colorless' | 'minimal';
      [key: string]: any;
    });
    
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number>;
    $executeRawUnsafe(query: string, ...values: any[]): Promise<number>;
    $queryRaw(query: TemplateStringsArray, ...values: any[]): Promise<any>;
    $queryRawUnsafe(query: string, ...values: any[]): Promise<any>;
    $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
    $transaction<T extends any[]>(queries: [...T]): Promise<T>;
    
    // Database models
    admin: any;
    teacher: any;
    student: any;
    parent: any;
    grade: any;
    class: any;
    subject: any;
    lesson: any;
    exam: any;
    examType: any;
    assignment: any;
    result: any;
    attendance: any;
    event: any;
    announcement: any;
    notification: any;
    [key: string]: any;
  }
  
  export namespace Prisma {
    export type TransactionClient = PrismaClient;
    export interface PrismaPromise<T> extends Promise<T> {
      [Symbol.toStringTag]: 'PrismaPromise';
    }
    [key: string]: any;
  }
  
  export const Prisma: typeof Prisma;
}

// React DOM Hook Compatibility
declare module 'react-dom' {
  export * from 'react-dom';
  export function useFormState<T>(
    action: (state: T, formData: FormData) => T | Promise<T>,
    initialState: T
  ): [T, (formData: FormData) => void];
}

// CSS Module Declaration for Tailwind
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Global type augmentations
declare global {
  interface Window {
    [key: string]: any;
  }
  
  var prisma: PrismaClient | undefined;
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      [key: string]: string | undefined;
    }
  }
}

export {};
