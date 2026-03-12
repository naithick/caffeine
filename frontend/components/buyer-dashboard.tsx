"use client"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { MarketplaceView } from "./marketplace-view"
import { PortfolioView } from "./portfolio-view"
import { CreditHistory } from "./credit-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Wallet, History, Leaf } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function BuyerDashboard() {
  const { currentUser, credits, sellOrders, trades } = useAppStore()
  const [activeTab, setActiveTab] = useState("marketplace")

  // Calculate stats
  const ownedCredits = credits.filter(c => c.owner_id === currentUser?.id && c.status !== 'retired')
  const totalCredits = ownedCredits.reduce((sum, c) => sum + c.metadata.co2_tonnage, 0)
  const openOrders = sellOrders.filter(o => o.status === 'open')
  const userTrades = trades.filter(t => t.status === 'settled')

  const stats = [
    {
      label: "Carbon Balance",
      value: `${totalCredits} tCO2e`,
      icon: <Leaf className="h-4 w-4" />,
      color: "text-primary"
    },
    {
      label: "ETH Balance",
      value: `${parseFloat(currentUser?.balance_eth || '0').toFixed(4)} ETH`,
      icon: <Wallet className="h-4 w-4" />,
      color: "text-foreground"
    },
    {
      label: "Available Credits",
      value: openOrders.length.toString(),
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-chart-2"
    },
    {
      label: "Total Trades",
      value: userTrades.length.toString(),
      icon: <History className="h-4 w-4" />,
      color: "text-chart-3"
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
              value="marketplace" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="mr-2 h-4 w-4" />
              My Portfolio
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-6">
            <MarketplaceView />
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
