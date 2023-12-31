import { notFound } from "next/navigation";

import { prisma } from "@awardrobe/prisma-types";

import { auth } from "@/utils/auth";
import { formatDate, formatTimeAgo } from "@/utils/utils";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const users = await prisma.user.findMany({
    include: { _count: { select: { productNotifications: true } } },
  });
  const numPrices = await prisma.price.count();

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const numNewPrices = await prisma.price.count({ where: { timestamp: { gte: yesterday } } });

  return (
    <section className="container max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-bold">Users ({users.length})</h2>
        <p className="text-muted-foreground text-sm">
          Users and the number of notifications they have.
        </p>
        <table className="mt-3 table-auto border-collapse border">
          <thead>
            <tr>
              <th className="border px-2 text-left font-semibold">User</th>
              <th className="border px-2 text-left font-semibold"># of Notifications</th>
              <th className="border px-2 text-left font-semibold">Email Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const email = user.email ?? "";
              return (
                <tr key={user.id}>
                  <td className="border px-2">{obscureEmail(email)}</td>
                  <td className="border px-2">{user._count.productNotifications}</td>
                  <td
                    className="border px-2"
                    title={user.emailVerified ? formatDate(user.emailVerified) : "n/a"}
                  >
                    {user.emailVerified ? formatTimeAgo(user.emailVerified) : "n/a"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-bold">Prices ({numPrices})</h2>
        <p className="text-muted-foreground text-sm">
          Number of prices across all product variants. {numNewPrices} (+
          {((numNewPrices / numPrices) * 100).toFixed(2)}%) new prices in the last 24 hours.
        </p>
      </div>
    </section>
  );
}

const obscureEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Invalid email";

  const host = domain.substring(0, domain.lastIndexOf("."));
  const tld = domain.substring(domain.lastIndexOf(".") + 1);
  if (!host || !tld) return "Invalid email";

  const first = name.at(0);
  const middle = name.slice(1, -1).replaceAll(/./g, "*");
  const last = name.at(-1);

  const firstHost = host.at(0);
  const middleHost = host.slice(1, -1).replaceAll(/./g, "*");
  const lastHost = host.at(-1);

  return `${first}${middle}${last}@${firstHost}${middleHost}${lastHost}.${tld}`;
};
