"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { LandingPage } from "@/components/landing-page"
import { RegisterForm } from "@/components/register-form"
import { KYCVerification } from "@/components/kyc-verification"
import { RoleSelection } from "@/components/role-selection"
import { BuyerDashboard } from "@/components/buyer-dashboard"
import { SellerDashboard } from "@/components/seller-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { CompanyDashboard } from "@/components/company-dashboard"
import { BlockchainUIProvider } from "@/components/blockchain-ui"
import { Loader2 } from "lucide-react"

export default function Home() {
  const currentView = useAppStore((state) => state.currentView)
  const fetchInitialData = useAppStore((state) => state.fetchInitialData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInitialData().finally(() => setIsLoading(false))
  }, [fetchInitialData])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <BlockchainUIProvider>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'register' && <RegisterForm />}
      {currentView === 'kyc' && <KYCVerification />}
      {currentView === 'role-select' && <RoleSelection />}
      {currentView === 'buyer' && <BuyerDashboard />}
      {currentView === 'seller' && <SellerDashboard />}
      {currentView === 'company' && <CompanyDashboard />}
      {currentView === 'admin' && <AdminDashboard />}
    </BlockchainUIProvider>
  )
}

