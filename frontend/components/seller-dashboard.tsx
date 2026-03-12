"use client"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { ProposalForm } from "./proposal-form"
import { SellerProposals } from "./seller-proposals"
import { PortfolioView } from "./portfolio-view"
import { CreditHistory } from "./credit-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Wallet, History, Leaf, Clock, CheckCircle2, Coins } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function SellerDashboard() {
  const { currentUser, proposals, credits } = useAppStore()
  const [activeTab, setActiveTab] = useState("proposals")

  // Calculate stats for this seller
  const userProposals = proposals.filter(p => p.producer_id === currentUser?.id)
  const approvedProposals = userProposals.filter(p => p.status === 'approved').length
  const pendingProposals = userProposals.filter(p => p.status === 'submitted' || p.status === 'under_review').length
  const rejectedProposals = userProposals.filter(p => p.status === 'rejected').length

  const userCredits = credits.filter(c => c.owner_id === currentUser?.id && c.status !== 'retired')
  const totalCredits = userCredits.reduce((sum, c) => sum + c.metadata.co2_tonnage, 0)

  const stats = [
    {
      label: "Carbon Credits",
      value: `${totalCredits} tCO2e`,
      icon: <Leaf className="h-4 w-4" />,
      color: "text-primary"
    },
    {
      label: "ETH Balance",
      value: `${parseFloat(currentUser?.balance_eth || '0').toFixed(4)} ETH`,
      icon: <Coins className="h-4 w-4" />,
      color: "text-foreground"
    },
    {
      label: "Pending Approval",
      value: pendingProposals.toString(),
      icon: <Clock className="h-4 w-4" />,
      color: "text-chart-3"
    },
    {
      label: "Approved",
      value: approvedProposals.toString(),
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-primary"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger 
              value="proposals"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              My Proposals
            </TabsTrigger>
            <TabsTrigger 
              value="new-proposal"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="mr-2 h-4 w-4" />
              My Credits
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <SellerProposals />
          </TabsContent>

          <TabsContent value="new-proposal" className="space-y-6">
            <ProposalForm onSuccess={() => setActiveTab('proposals')} />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioView />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <CreditHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
