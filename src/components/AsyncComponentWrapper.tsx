'use client';

import React, { Suspense } from 'react';

// Wrapper for async server components to be used in client components
interface AsyncComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AsyncComponentWrapper({ 
  children, 
  fallback = <div>Loading...</div> 
}: AsyncComponentWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// HOC to wrap server components for client usage
export function withAsyncWrapper<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AsyncComponentWrapper fallback={fallback}>
        <Component {...props} />
      </AsyncComponentWrapper>
    );
  };
}

// Helper to handle async components in client components
export function AsyncComponent<T extends Record<string, any>>({
  component: Component,
  fallback = <div>Loading...</div>,
  ...props
}: {
  component: React.ComponentType<T>;
  fallback?: React.ReactNode;
} & T) {
  return (
    <Suspense fallback={fallback}>
      <Component {...(props as T)} />
    </Suspense>
  );
}

export default AsyncComponentWrapper;
