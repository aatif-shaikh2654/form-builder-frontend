import React from 'react';

interface LayoutWireframeProps {
  columns: number;
  className?: string;
  isActive?: boolean;
}

export const LayoutWireframe: React.FC<LayoutWireframeProps> = ({
  columns,
  className = '',
  isActive = false,
}) => {
  const safeCols = Math.max(1, Math.min(12, columns));

  return (
    <div
      className={`flex items-stretch gap-1 p-1 rounded-sm border transition-colors ${
        isActive
          ? 'bg-primary/15 border-primary/40'
          : 'bg-muted/50 border-border/80 group-hover:border-primary/30 group-hover:bg-primary/5'
      } ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: safeCols }).map((_, i) => (
        <span
          key={i}
          className={`flex-1 rounded-[2px] transition-colors ${
            isActive
              ? 'bg-primary'
              : 'bg-muted-foreground/35 group-hover:bg-primary/60'
          }`}
          style={{ minWidth: '4px' }}
        />
      ))}
    </div>
  );
};
