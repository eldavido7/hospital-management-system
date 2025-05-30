"use client";

import { MainLayout } from "@/components/layout/main-layout";
import DepositForm from "@/app/billing/deposit-form";
import { Toaster } from "@/components/ui/toaster";

export default function DepositPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DepositForm />
      </div>
      <Toaster />
    </MainLayout>
  );
}
