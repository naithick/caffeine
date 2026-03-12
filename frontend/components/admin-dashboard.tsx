"use client"

import { useState } from "react"
import { DashboardHeader } from "./dashboard-header"
import { PendingProposals } from "./pending-proposals"
import { AllProposals } from "./all-proposals"
import { PlatformStats } from "./platform-stats"
import { CreditHistory } from "./credit-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Clock, FileText, BarChart3, History, Users, CheckCircle2, Leaf } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function AdminDashboard() {
  const { proposals, credits, users, trades } = useAppStore()
  const [activeTab, setActiveTab] = useState("pending")

  // Calculate admin stats
  const pendingCount = proposals.filter(p => p.status === 'submitted').length
  const approvedCount = proposals.filter(p => p.status === 'approved').length
  const totalCredits = credits.reduce((sum, c) => sum + c.metadata.co2_tonnage, 0)
  const activeUsers = users.length

  const stats = [
    {
      label: "Pending Review",
      value: pendingCount.toString(),
      icon: <Clock className="h-4 w-4" />,
      color: "text-chart-3",
      urgent: pendingCount > 0
    },
    {
      label: "Approved Credits",
      value: `${totalCredits} tCO2e`,
      icon: <Leaf className="h-4 w-4" />,
      color: "text-primary"
    },
    {
      label: "Total Proposals",
      value: approvedCount.toString(),
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-chart-2"
    },
    {
      label: "Active Users",
      value: activeUsers.toString(),
      icon: <Users className="h-4 w-4" />,
      color: "text-foreground"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className={`border-border bg-card ${stat.urgent ? 'ring-2 ring-chart-3' : ''}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                </div>
                {stat.urgent && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending Review
              {pendingCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-chart-3 text-xs text-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              All Proposals
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Platform Stats
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <PendingProposals />
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <AllProposals />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <PlatformStats />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <CreditHistory showAll />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
