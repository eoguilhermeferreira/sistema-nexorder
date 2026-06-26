import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar companyName="Pizzaria Bento" companyEmoji="🍕" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
