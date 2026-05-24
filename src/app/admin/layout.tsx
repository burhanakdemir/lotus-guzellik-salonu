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
    <div className="admin-shell min-h-screen bg-gray-100">
      <AdminNav
        session={
          session && isAdminSession(session)
            ? {
                role: session.role as "ADMIN" | "STAFF_ADMIN",
                isMultiAdmin: isMultiAdminEnabled(),
              }
            : null
        }
      />
      <div className="admin-shell__content mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
