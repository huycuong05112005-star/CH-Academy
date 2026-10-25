import React from 'react'

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-100 dark:bg-[#1C293D] border-b border-slate-200 dark:border-[#2A3A50] mb-2 rounded-t-xl" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center gap-4 px-4 py-3.5 bg-white dark:bg-[#151F31] border border-slate-100 dark:border-[#2A3A50]/60 rounded-lg"
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded-sm"
                style={{ width: `${Math.max(15, (100 / columns) - 3)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#151F31] p-5 rounded-2xl border border-slate-200 dark:border-[#2A3A50] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-sm" />
        <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
      <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md mt-4" />
      <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded-sm mt-3" />
    </div>
  )
}
