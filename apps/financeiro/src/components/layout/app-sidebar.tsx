import { auth, getCurrentOrg } from "@/auth/auth";

import SidebarClient from "./sidebar-client";

export default async function AppSidebar() {
  const currentOrg = await getCurrentOrg()
  const { user } = await auth(); // executa no servidor

  return <SidebarClient user={user} slug={currentOrg ?? null} />;
}
