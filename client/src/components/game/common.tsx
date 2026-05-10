export const SectionMark = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 inline-block" />
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{children}</span>
  </div>
)
