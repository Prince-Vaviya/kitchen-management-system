"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface LazyLoadProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
}

export function LazyLoad({
  children,
  className = "",
  threshold = 0.1,
  delay = 0,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StaggeredList({
  children,
  className = "",
}: {
  children: ReactNode[];
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <LazyLoad key={index} delay={index * 100}>
          {child}
        </LazyLoad>
      ))}
    </div>
  );
}
