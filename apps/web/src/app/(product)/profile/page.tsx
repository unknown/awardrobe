import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { NotificationList } from "@/components/notification/NotificationsList";
import { authOptions } from "@/utils/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    redirect("/login");
  }
  return (
    <section className="container max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Email</h2>
        <div className="space-y-6">{session.user.email}</div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Notifications</h2>
        <NotificationList />
      </section>
    </section>
  );
}
