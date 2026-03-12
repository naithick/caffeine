"use client"

import { Leaf, ShoppingCart, Store, Shield, ArrowRight, CheckCircle2, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import type { UserRole } from "@/lib/types"

export function RoleSelection() {
  const { currentUser, selectRole } = useAppStore()

  const handleRoleSelect = (role: UserRole) => {
    if (currentUser) {
      selectRole(currentUser.id, role)
    }
  }

  const roles = [
    {
      id: 'buyer' as UserRole,
      title: 'Investor',
      description: 'Acquire verified carbon credits to build your environmental portfolio and support global sustainability initiatives.',
      icon: <ShoppingCart className="h-6 w-6" />,
      features: [
        'Browse verified carbon credits',
        'Trade on live marketplace',
        'Track offset portfolio',
        'Generate retirement certificates'
      ]
    },
    {
      id: 'producer' as UserRole,
      title: 'Project Developer',
      description: 'Submit environmental projects for rigorous MRV verification and issue high-quality carbon credits to the registry.',
      icon: <Store className="h-6 w-6" />,
      features: [
        'Submit project proposals',
        'Undergo third-party verification',
        'Receive minted carbon credits',
        'Manage market listings'
      ]
    },
    {
      id: 'company' as UserRole,
      title: 'Corporate Entity',
      description: 'Comprehensive access for organizations to both originate carbon reduction projects and retire credits for footprint offset.',
      icon: <Building className="h-6 w-6" />,
      features: [
        'Manage corporate proposals',
        'Issue and list credits',
        'Fulfill offset requirements',
        'Consolidated ESG reporting'
      ]
    },
    {
      id: 'certification_body' as UserRole,
      title: 'Verifier',
      description: 'Independent auditor conducting strict MRV reviews of submitted projects before credit issuance is authorized.',
      icon: <Shield className="h-6 w-6" />,
      features: [
        'Audit pending proposals',
        'Evaluate sensor & satellite data',
        'Approve or reject projects',
        'Ensure registry compliance'
      ]
    }
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Leaf className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">CarbonX</span>
      </div>

      {/* Welcome Message */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {currentUser?.display_name || 'User'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to participate in the carbon credit marketplace
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4 px-4 pb-12">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="group relative cursor-pointer border-border bg-card transition-all hover:border-primary/50 flex flex-col"
            onClick={() => handleRoleSelect(role.id)}
          >
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {role.icon}
              </div>
              <CardTitle className="text-xl text-foreground">{role.title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <ul className="space-y-2 flex-1">
                {role.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelect(role.id);
                }}
              >
                Continue as {role.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Info */}
      <div className="mt-8 flex items-center gap-4 rounded-xl border border-border bg-card px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">KYC Verified</div>
          <div className="text-xs text-muted-foreground font-mono">
            {currentUser?.wallet_address.slice(0, 6)}...{currentUser?.wallet_address.slice(-4)}
          </div>
        </div>
      </div>
    </div>
  )
}
