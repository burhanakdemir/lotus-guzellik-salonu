import { NotificationsAdmin } from "@/components/admin/NotificationsAdmin";

export default function AdminBildirimlerPage() {
  return (
    <div>
      <h1>Bildirimler</h1>
      <p className="mb-3 text-sm text-gray-500">
        Üyelere uygulama içi mesaj gönderin. Tarayıcı bildirimi, izin vermiş üyelere
        otomatik iletilir.
      </p>
      <NotificationsAdmin />
    </div>
  );
}
