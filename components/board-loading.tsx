export function BoardLoading() {
  return (
    <div className="flex gap-5 overflow-x-auto pb-4">
      {[0, 1].map((column) => (
        <section
          key={column}
          className="min-w-[min(22rem,calc(100vw-2rem))] flex-1 rounded-[28px] border border-black/5 bg-[#ece8df] p-4"
        >
          <div className="mb-4 h-6 w-40 animate-pulse rounded-full bg-white/80" />
          <div className="space-y-3">
            {[0, 1, 2].map((card) => (
              <div
                key={card}
                className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm shadow-zinc-950/5"
              >
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-zinc-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
