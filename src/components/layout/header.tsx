interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 md:px-6 py-3 md:py-3.5 bg-background/80 backdrop-blur-sm sticky top-12 md:top-0 z-10">
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-bold tracking-tight truncate">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 ml-2">{actions}</div>}
    </header>
  );
}
