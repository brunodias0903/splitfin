import { redirect } from "next/navigation";

import { getSession } from "@/modules/auth/infrastructure/session";

export default async function HomePage() {
  redirect((await getSession()) ? "/dashboard" : "/login");
}
