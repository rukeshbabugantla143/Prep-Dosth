import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
    <Skeleton className="w-12 h-12 rounded-xl mb-4" />
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="space-y-2 mb-6 flex-grow">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

export const CategorySkeleton = () => (
  <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center text-center">
    <Skeleton className="w-12 h-12 rounded-full mb-4" />
    <Skeleton className="h-5 w-24 mb-1" />
    <Skeleton className="h-4 w-16" />
  </div>
);
