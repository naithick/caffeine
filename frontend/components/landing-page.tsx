"use client"

import { Leaf, Shield, TrendingUp, Zap, Users, Store, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function LandingPage() {
  const { setCurrentView, loginAsUser, users } = useAppStore()
  
  // Get demo users
  const demoSeller = users.find(u => u.id === 'seller-001')
  const demoBuyer = users.find(u => u.id === 'buyer-001')
  const demoAdmin = users.find(u => u.id === 'admin-001')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">CarbonX</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              Marketplace
            </span>
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              How It Works
            </span>
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              For Producers
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-foreground"
              onClick={() => setCurrentView('register')}
            >
              Login
            </Button>
            <Button 
              onClick={() => setCurrentView('register')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary">Live Carbon Credit Trading</span>
          </div>
          <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            CarbonX: The Hardware-Verified Carbon Ledger.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Bridging the gap between physical sensors and digital credits. We use IoT telemetry and geospatial data to ensure every carbon credit is backed by real-world evidence, stored on an immutable blockchain.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              onClick={() => setCurrentView('register')}
            >
              Start Trading
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">$24M+</div>
            <div className="mt-1 text-sm text-muted-foreground">Trading Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">1.2M</div>
            <div className="mt-1 text-sm text-muted-foreground">Credits Traded</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">340+</div>
            <div className="mt-1 text-sm text-muted-foreground">Verified Producers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">99.9%</div>
            <div className="mt-1 text-sm text-muted-foreground">Verification Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">Why Choose CarbonX</h2>
          <p className="mt-3 text-muted-foreground">
            Built for transparency, security, and global impact
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Verified Credits"
            description="Every credit is verified by UNFCCC-accredited bodies with satellite MRV data"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Instant Settlement"
            description="On-chain escrow ensures atomic swaps with instant settlement"
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Real-time Trading"
            description="Live order book with transparent pricing and market depth"
          />
          <FeatureCard
            icon={<Leaf className="h-6 w-6" />}
            title="Impact Tracking"
            description="Full provenance from forest to retirement with burn certificates"
          />
        </div>
      </section>

      {/* Demo Login Section */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground">Try the Demo</h2>
            <p className="mt-3 text-muted-foreground">
              Experience the platform from different perspectives. All roles interact in real-time.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Buyer Demo */}
            <Card className="border-border bg-card hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-foreground">Login as Buyer</CardTitle>
                <CardDescription>
                  Purchase credits from the marketplace, burn them for offsets, or resell
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="text-foreground font-medium">{demoBuyer?.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="text-foreground">{parseFloat(demoBuyer?.balance_eth || '0').toFixed(2)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="text-primary font-medium">{demoBuyer?.carbon_credits} tCO2e</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => loginAsUser('buyer-001')}
                >
                  Enter as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Seller Demo */}
            <Card className="border-border bg-card hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="h-6 w-6" />
                </div>
                <CardTitle className="text-foreground">Login as Seller</CardTitle>
                <CardDescription>
                  Submit carbon projects for verification, receive credits, and trade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="text-foreground font-medium">{demoSeller?.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="text-foreground">{parseFloat(demoSeller?.balance_eth || '0').toFixed(2)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="text-primary font-medium">{demoSeller?.carbon_credits} tCO2e</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => loginAsUser('seller-001')}
                >
                  Enter as Seller
                </Button>
              </CardContent>
            </Card>

            {/* Admin Demo */}
            <Card className="border-border bg-card hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-foreground">Login as Admin</CardTitle>
                <CardDescription>
                  Review and approve seller proposals, monitor platform activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="text-foreground font-medium">{demoAdmin?.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <span className="text-foreground">Certification Body</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-destructive font-medium">4 proposals</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => loginAsUser('admin-001')}
                >
                  Enter as Admin
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Make an Impact?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join hundreds of producers and buyers already trading on the most 
            transparent carbon marketplace.
          </p>
          <Button 
            size="lg" 
            className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            onClick={() => setCurrentView('register')}
          >
            Create Your Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">CarbonX</span>
            </div>
            <div className="text-sm text-muted-foreground">
              2026 CarbonX. Decentralized Carbon Credit Trading.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
