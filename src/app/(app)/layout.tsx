import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  // Middleware should already have redirected unauth'd users — this is a
  // defensive guard for direct hits and to satisfy the type narrowing below.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.name ?? user.email ?? "?";

  return (
    <div className="flex min-h-screen flex-col">
      <BackgroundBlobs />
      <Header name={displayName} email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
