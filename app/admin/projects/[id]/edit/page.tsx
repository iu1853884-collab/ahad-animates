"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import AdminProjectsPage from "@/app/admin/projects/page";

function EditProjectRoute() {
  const { id } = useParams<{ id: string }>();
  return <AdminProjectsPage routeEditId={id} />;
}

export default function EditProjectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#070709] text-sm text-zinc-400">
          Loading project...
        </main>
      }
    >
      <EditProjectRoute />
    </Suspense>
  );
}
