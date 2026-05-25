import { AdminNav } from "@/components/admin/AdminNav";
import { getSession, isAdminSession } from "@/lib/auth";
import { isMultiAdminEnabled } from "@/lib/staff-admin";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="admin-shell">
      <AdminNav
        session={
          session && isAdminSession(session)
            ? {
                role: session.role as "ADMIN" | "STAFF_ADMIN",
                isMultiAdmin: isMultiAdminEnabled(),
                showNotifications: true,
              }
            : null
        }
      />
      <div className="admin-shell__content">
        {children}
      </div>
    </div>
  );
}
