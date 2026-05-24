import {
  getServiceCategoryLabel,
  SERVICE_CATEGORY_ORDER,
  type ServiceCategorySlug,
} from "@/lib/service-categories";
import { servicesCatalog } from "../../prisma/services-catalog";

/** Katalogdaki tanım sırası (ana başlık altındaki sıra) */
const CATALOG_SLUG_ORDER = new Map(
  servicesCatalog.map((item, index) => [item.slug, index])
);

export type ServiceWithCategory = {
  category: string;
  name: string;
  slug: string;
};

export function sortServicesInCategory<T extends ServiceWithCategory>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const ia = CATALOG_SLUG_ORDER.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const ib = CATALOG_SLUG_ORDER.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name, "tr");
  });
}

export function groupServicesByCategory<T extends ServiceWithCategory>(
  services: T[]
): {
  grouped: Record<string, T[]>;
  sortedCategories: string[];
} {
  const grouped = services.reduce(
    (acc, s) => {
      const cat = s.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, T[]>
  );

  for (const cat of Object.keys(grouped)) {
    grouped[cat] = sortServicesInCategory(grouped[cat]);
  }

  const known = SERVICE_CATEGORY_ORDER.filter((c) => grouped[c]?.length);
  const unknown = Object.keys(grouped)
    .filter(
      (c) =>
        !SERVICE_CATEGORY_ORDER.includes(c as ServiceCategorySlug)
    )
    .sort((a, b) =>
      getServiceCategoryLabel(a).localeCompare(
        getServiceCategoryLabel(b),
        "tr"
      )
    );

  return {
    grouped,
    sortedCategories: [...known, ...unknown],
  };
}

export function categorySectionId(category: string): string {
  return `kategori-${category}`;
}
