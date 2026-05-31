export default function InboxPage() {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Inbox</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-8">
        Inbox
      </h1>

      <div className="rounded-xl border border-dashed border-[var(--cl-line)] p-8 text-center">
        <p className="font-display text-xl mb-1">Coming in Phase 5</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The brand-offer inbox will surface who&apos;s reaching out and what
          they&apos;re offering — forwarded brand emails parsed into clean offer
          cards. Built on the unified <code>conversations</code> schema that
          already ships in the database.
        </p>
      </div>
    </div>
  );
}
