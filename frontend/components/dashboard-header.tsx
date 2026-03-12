"use client"

import { Leaf, Bell, LogOut, User, Wallet, X, CheckCircle, AlertCircle, Info, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"

export function DashboardHeader() {
  const { currentUser, setCurrentView, setCurrentUser, proposals, notifications, clearNotification } = useAppStore()

  // Count pending proposals for admin notification
  const pendingProposals = proposals.filter(p => p.status === 'submitted').length
  
  const getNotificationIcon = (type: 'success' | 'info' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-destructive" />
      default: return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentView('landing')
  }

  const handleSwitchAccount = () => {
    setCurrentUser(null)
    setCurrentView('register')
  }

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('landing')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">CarbonX</span>
          </div>

          {/* Role Badge */}
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary capitalize">
            {currentUser?.role === 'certification_body' ? 'Verifier' : 
             currentUser?.role === 'buyer' ? 'Investor' : 
             currentUser?.role === 'producer' ? 'Project Developer' : 
             currentUser?.role === 'company' ? 'Corporate Entity' : 
             currentUser?.role}
          </Badge>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Balance Display */}
          <div className="hidden items-center gap-4 rounded-lg border border-border bg-secondary px-4 py-2 md:flex">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {formatBalance(currentUser?.balance_eth || '0')} ETH
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {currentUser?.carbon_credits || 0} Credits
              </span>
            </div>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {(notifications.length > 0 || (pendingProposals > 0 && currentUser?.role === 'certification_body')) && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                    {notifications.length + (currentUser?.role === 'certification_body' ? pendingProposals : 0)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border max-h-96 overflow-y-auto">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-sm font-medium text-foreground">Notifications</div>
              </div>
              {currentUser?.role === 'certification_body' && pendingProposals > 0 && (
                <div className="px-3 py-2 border-b border-border bg-destructive/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-foreground">{pendingProposals} proposals awaiting review</span>
                  </div>
                </div>
              )}
              {notifications.length === 0 && pendingProposals === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="px-3 py-2 border-b border-border last:border-0 hover:bg-secondary/50">
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => clearNotification(notif.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden md:inline-block max-w-32 truncate">
                  {currentUser?.display_name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-foreground">{currentUser?.display_name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {currentUser?.wallet_address}
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <div className="px-3 py-2 md:hidden">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="text-foreground">{formatBalance(currentUser?.balance_eth || '0')} ETH</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="text-foreground">{currentUser?.carbon_credits || 0}</span>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-border md:hidden" />
              <DropdownMenuItem onClick={handleSwitchAccount} className="text-foreground cursor-pointer">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Switch Account
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
