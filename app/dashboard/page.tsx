import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background px-6 py-10 text-secondary">
          Chargement du tableau de bord…
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
