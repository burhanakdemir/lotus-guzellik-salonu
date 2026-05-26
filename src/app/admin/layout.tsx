import { AdminNav } from "@/components/admin/AdminNav";
import { getSession, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMultiAdminEnabled, isSuperAdmin } from "@/lib/staff-admin";
import { getStaffDisplayName } from "@/lib/staff-display-name";
import { SUPER_ADMIN_DISPLAY_NAME } from "@/lib/staff-panel";
import "./admin.css";

async function adminNavDisplayName(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
): Promise<string> {
  if (isSuperAdmin(session.role)) {
    return SUPER_ADMIN_DISPLAY_NAME;
  }
  if (session.role === "STAFF_ADMIN" && session.staffProfileId) {
    const profile = await prisma.staffAdminProfile.findUnique({
      where: { id: session.staffProfileId },
      select: { label: true, user: { select: { name: true } } },
    });
    if (profile) {
      const name = getStaffDisplayName(profile);
      if (name) return name;
    }
  }
  return session.name.trim() || SUPER_ADMIN_DISPLAY_NAME;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  const navSession =
    session && isAdminSession(session)
      ? {
          role: session.role as "ADMIN" | "STAFF_ADMIN",
          isMultiAdmin: isMultiAdminEnabled(),
          showNotifications: true,
          displayName: await adminNavDisplayName(session),
        }
      : null;

  return (
    <div className="admin-shell">
      <AdminNav session={navSession} />
      <div className="admin-shell__content">
        {children}
      </div>
    </div>
  );
}
