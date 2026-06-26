import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";
import { CompanyProvider } from "@/contexts/CompanyContext";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, fantasy_name, slug")
    .eq("owner_id", user.id)
    .single();

  if (!company) redirect("/onboarding");

  return (
    <CompanyProvider company={company}>
      <div className="flex min-h-screen bg-background">
        <Sidebar companyName={company.fantasy_name ?? company.name} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </CompanyProvider>
  );
}
