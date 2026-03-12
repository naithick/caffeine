"use client"

import { BarChart3, Leaf, Users, TrendingUp, Flame } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function PlatformStats() {
  const { users, proposals, credits, trades, history } = useAppStore()

  // Calculate various stats
  const producers = users.filter(u => u.role === 'producer').length
  const buyers = users.filter(u => u.role === 'buyer').length
  const admins = users.filter(u => u.role === 'certification_body').length

  const totalCredits = credits.reduce((sum, c) => sum + c.metadata.co2_tonnage, 0)
  const mintedCredits = credits.filter(c => c.status === 'minted').length
  const listedCredits = credits.filter(c => c.status === 'listed').length
  const transferredCredits = credits.filter(c => c.status === 'transferred').length
  const retiredCredits = credits.filter(c => c.status === 'retired').length

  const totalTradeVolume = trades.reduce((sum, t) => sum + parseFloat(t.execution_price_eth), 0)
  const settledTrades = trades.filter(t => t.status === 'settled').length

  const approvalRate = proposals.length > 0
    ? (proposals.filter(p => p.status === 'approved').length / proposals.length * 100).toFixed(1)
    : '0'

  const retiredTonnage = credits
    .filter(c => c.status === 'retired')
    .reduce((sum, c) => sum + c.metadata.co2_tonnage, 0)

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Users className="h-4 w-4 text-primary" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Producers</span>
                <span className="text-sm font-medium text-foreground">{producers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Buyers</span>
                <span className="text-sm font-medium text-foreground">{buyers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verifiers</span>
                <span className="text-sm font-medium text-foreground">{admins}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">{users.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              Credit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Minted</span>
                <span className="text-sm font-medium text-foreground">{mintedCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Listed</span>
                <span className="text-sm font-medium text-foreground">{listedCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transferred</span>
                <span className="text-sm font-medium text-foreground">{transferredCredits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retired</span>
                <span className="text-sm font-medium text-destructive">{retiredCredits}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Total tCO2e</span>
                  <span className="text-lg font-bold text-primary">{totalCredits}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trading Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Settled Trades</span>
                <span className="text-sm font-medium text-foreground">{settledTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Volume</span>
                <span className="text-sm font-medium text-foreground">{totalTradeVolume.toFixed(4)} ETH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approval Rate</span>
                <span className="text-sm font-medium text-primary">{approvalRate}%</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">History Events</span>
                  <span className="text-lg font-bold text-primary">{history.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Flame className="h-5 w-5 text-destructive" />
            Environmental Impact
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Carbon credits permanently retired to offset emissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
              <Flame className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-4xl font-bold text-foreground">{retiredTonnage} tCO2e</div>
            <div className="mt-2 text-muted-foreground">Carbon Retired</div>
            <div className="mt-4 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-semibold text-foreground">{retiredCredits}</div>
                <div className="text-sm text-muted-foreground">Credits Burned</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {(retiredTonnage * 2.5).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Trees Equivalent</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {(retiredTonnage * 4.6).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Flights Offset</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
