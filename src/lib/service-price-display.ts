/** Hizmet bazlı fiyat görünürlüğü (salon genel ayarı açıkken geçerli) */
export type ServicePriceFlags = {
  showPricePublic?: boolean;
  showPriceOnHomepage?: boolean;
};

export function shouldShowServicePrice(
  globalShowPrice: boolean,
  service: ServicePriceFlags,
  context: "public" | "home"
): boolean {
  if (!globalShowPrice) return false;
  if (context === "home") {
    return service.showPriceOnHomepage === true;
  }
  return service.showPricePublic !== false;
}
