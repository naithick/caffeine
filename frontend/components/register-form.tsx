"use client"

import { useState } from "react"
import { Leaf, Wallet, ArrowRight, CheckCircle2, Mail, Lock, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

type AuthMode = 'login' | 'register'

export function RegisterForm() {
  const { setCurrentView, registerUser, loginWithEmail } = useAppStore()
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Register state
  const [step, setStep] = useState<'wallet' | 'details'>('wallet')
  const [walletAddress, setWalletAddress] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleLogin = async () => {
    if (!loginEmail.trim()) return
    setLoginError('')
    setIsLoggingIn(true)

    const result = await loginWithEmail(loginEmail, loginPassword || 'demo123')

    if (result.success) {
      // Route directly to the correct dashboard based on role
      const role = result.role
      if (role === 'producer') {
        setCurrentView('seller')
      } else if (role === 'buyer') {
        setCurrentView('buyer')
      } else if (role === 'certification_body') {
        setCurrentView('admin')
      } else if (role === 'company') {
        setCurrentView('company')
      } else {
        setCurrentView('role-select')
      }
    } else {
      setLoginError(result.error || 'Login failed')
    }
    setIsLoggingIn(false)
  }

  const simulateWalletConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      const mockAddress = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      setWalletAddress(mockAddress)
      setIsConnecting(false)
      setStep('details')
    }, 1500)
  }

  const handleRegister = async () => {
    if (!displayName.trim()) return
    await registerUser(walletAddress, displayName)
    setCurrentView('kyc')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Leaf className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">CarbonX</span>
      </div>

      <Card className="w-full max-w-md border-border bg-card">
        {/* Auth Mode Tabs */}
        <div className="flex border-b border-border">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              authMode === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setAuthMode('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              authMode === 'register'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>
        </div>

        {authMode === 'login' ? (
          /* ════════════════ LOGIN TAB ════════════════ */
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in with your registered email to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="e.g. admin@greenforest.io"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter any password (demo)"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="pl-10 bg-secondary border-border text-foreground"
                  />
                </div>
              </div>

              {loginError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                  {loginError}
                </div>
              )}

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleLogin}
                disabled={!loginEmail.trim() || isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              {/* Demo Accounts Helper */}
              <div className="rounded-lg bg-secondary border border-border p-4">
                <div className="text-xs font-medium text-foreground mb-2">Demo Accounts</div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Project Developer:</span>
                    <button
                      className="font-mono text-primary hover:underline"
                      onClick={() => { setLoginEmail('admin@greenforest.io'); setLoginPassword('demo123'); }}
                    >
                      admin@greenforest.io
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span>Investor:</span>
                    <button
                      className="font-mono text-primary hover:underline"
                      onClick={() => { setLoginEmail('trade@ecotrade.com'); setLoginPassword('demo123'); }}
                    >
                      trade@ecotrade.com
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span>Verifier:</span>
                    <button
                      className="font-mono text-primary hover:underline"
                      onClick={() => { setLoginEmail('audit@verraaudit.org'); setLoginPassword('demo123'); }}
                    >
                      audit@verraaudit.org
                    </button>
                  </div>
                </div>
              </div>

              {/* Back to Landing */}
              <div className="text-center">
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setCurrentView('landing')}
                >
                  Back to Home
                </button>
              </div>
            </CardContent>
          </>
        ) : (
          /* ════════════════ REGISTER TAB ════════════════ */
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-foreground">
                {step === 'wallet' ? 'Connect Your Wallet' : 'Complete Your Profile'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {step === 'wallet'
                  ? 'Connect your wallet to access the carbon credit marketplace'
                  : 'Enter your details to complete registration'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 'wallet' ? (
                <>
                  {/* Wallet Connection Options */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-between border-border bg-secondary text-foreground hover:bg-secondary/80 h-14"
                      onClick={simulateWalletConnect}
                      disabled={isConnecting}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6851B]/10">
                          <Wallet className="h-5 w-5 text-[#F6851B]" />
                        </div>
                        <span>MetaMask</span>
                      </div>
                      {isConnecting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-between border-border bg-secondary text-foreground hover:bg-secondary/80 h-14"
                      onClick={simulateWalletConnect}
                      disabled={isConnecting}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B99FC]/10">
                          <Wallet className="h-5 w-5 text-[#3B99FC]" />
                        </div>
                        <span>WalletConnect</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-between border-border bg-secondary text-foreground hover:bg-secondary/80 h-14"
                      onClick={simulateWalletConnect}
                      disabled={isConnecting}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <span>Coinbase Wallet</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
                    />
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => walletAddress && setStep('details')}
                      disabled={!walletAddress}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Connected Wallet Display */}
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">Wallet Connected</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {walletAddress}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Display Name</label>
                      <Input
                        placeholder="Enter your name or organization"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleRegister}
                      disabled={!displayName.trim()}
                    >
                      Continue to Verification
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Back to Landing */}
              <div className="text-center">
                <button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setCurrentView('landing')}
                >
                  Back to Home
                </button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
