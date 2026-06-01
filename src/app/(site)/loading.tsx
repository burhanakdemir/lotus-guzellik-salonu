export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 lg:px-8">
      <div className="mx-auto h-8 w-48 rounded bg-rose-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-rose-50" />
        ))}
      </div>
    </div>
  );
}
