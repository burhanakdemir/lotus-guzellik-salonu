import Link from "next/link";

export type StaffPublicOption = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
};

export function StaffPublicPicker({
  staff,
  basePath,
  title = "Ustalarımız",
}: {
  staff: StaffPublicOption[];
  basePath: "/galeri" | "/yorumlar";
  title?: string;
}) {
  if (staff.length === 0) return null;

  return (
    <section className="mb-8 md:mb-12">
      <h2 className="font-display mb-4 text-center text-2xl text-lotus-800 md:text-3xl">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <Link
            key={s.id}
            href={`${basePath}/${s.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow-md"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: s.color || "#d97b9a" }}
              aria-hidden
            />
            <span className="font-medium text-rose-900 group-hover:text-lotus-800">
              {s.label}
            </span>
            <span className="ml-auto text-xs text-gray-400 group-hover:text-lotus-600">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
