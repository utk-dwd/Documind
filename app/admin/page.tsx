import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { FileText, Layers, MessageSquare, Users } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SessionChart } from "@/components/admin/SessionChart";

export default async function AdminDashboardPage() {
  const [docCount, chunkCount, sessionCount, client] = await Promise.all([
    prisma.document.count(),
    prisma.documentChunk.count(),
    prisma.chatSession.count(),
    clerkClient(),
  ]);

  const userCount = await client.users.getCount();

  const stats = [
    {
      label: "Total Documents",
      value: docCount,
      icon: <FileText className="size-5" />,
    },
    {
      label: "Chunks Indexed",
      value: chunkCount,
      icon: <Layers className="size-5" />,
    },
    {
      label: "Chat Sessions",
      value: sessionCount,
      icon: <MessageSquare className="size-5" />,
    },
    {
      label: "Registered Users",
      value: userCount,
      icon: <Users className="size-5" />,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">System overview</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div className="mt-6">
        <SessionChart />
      </div>
    </div>
  );
}
