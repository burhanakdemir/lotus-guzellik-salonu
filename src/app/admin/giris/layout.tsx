/** Admin giriş — tam ekran ortalı form (nav gizli) */
export default function AdminGirisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-giris-only -mx-4 -my-3 flex min-h-[calc(100vh-0px)] items-center justify-center sm:-mx-6 lg:-mx-8">
      {children}
    </div>
  );
}
