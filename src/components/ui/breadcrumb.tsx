// src/components/breadcrumb.tsx
import React from 'react';
import Link from 'next/link';

export function Breadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {children}
      </ol>
    </nav>
  );
}

export function BreadcrumbList({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function BreadcrumbItem({ children }: { children: React.ReactNode }) {
  return <li className="inline-flex items-center">{children}</li>;
}

export function BreadcrumbLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-gray-700 hover:text-blue-600">
      {children}
    </Link>
  );
}

export function BreadcrumbSeparator() {
  return <span className="mx-2 text-gray-400">/</span>;
}

export function BreadcrumbPage({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-gray-500">{children}</span>;
}
