"use client"

import { useState } from "react"
import { Leaf, Flame, Tag, CheckCircle2, MapPin, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import { useBlockchainUI } from "@/components/blockchain-ui"
import { CreditTimeline } from "@/components/credit-lifecycle"
import { RetirementCertificate } from "@/components/credit-lifecycle"

export function PortfolioView() {
  const { currentUser, credits, sellOrders, listCreditForSale, burnCredit } = useAppStore()
  const [selectedCredit, setSelectedCredit] = useState<string | null>(null)
  const [showSellDialog, setShowSellDialog] = useState(false)
  const [showBurnDialog, setShowBurnDialog] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const [showTimeline, setShowTimeline] = useState<string | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [actionSuccess, setActionSuccess] = useState<'sell' | 'burn' | null>(null)
  const [retiredCreditData, setRetiredCreditData] = useState<{ title: string; tonnage: number; txHash: string; tokenId: string } | null>(null)
  const { showTxToast, requestWalletSign } = useBlockchainUI()

  // Get user's credits
  const userCredits = credits.filter(
    c => c.owner_id === currentUser?.id
  )

  // Check if credit is already listed
  const isListed = (creditId: string) => {
    return sellOrders.some(o => o.credit_id === creditId && o.status === 'open')
  }

  const handleSellClick = (creditId: string) => {
    setSelectedCredit(creditId)
    setSellPrice('')
    setShowSellDialog(true)
    setActionSuccess(null)
  }

  const handleBurnClick = (creditId: string) => {
    setSelectedCredit(creditId)
    setShowBurnDialog(true)
    setActionSuccess(null)
  }

  const handleConfirmSell = async () => {
    if (selectedCredit && currentUser && sellPrice) {
      const creditData = credits.find(c => c.id === selectedCredit)
      const confirmed = await requestWalletSign({
        action: 'List Credit on Marketplace',
        details: `Listing ${creditData?.metadata?.co2_tonnage || '—'} tCO₂e for ${sellPrice} ETH`,
        walletAddress: currentUser.wallet_address,
        gasEstimate: '0.0028 ETH (~$7.00)',
      })
      if (!confirmed) return

      listCreditForSale(currentUser.id, selectedCredit, sellPrice)
      setActionSuccess('sell')

      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      showTxToast({
        action: 'list',
        txHash: mockTxHash,
        tokenId: creditData?.token_id,
        message: `Credit listed for ${sellPrice} ETH`,
      })

      setTimeout(() => {
        setShowSellDialog(false)
        setSelectedCredit(null)
        setActionSuccess(null)
      }, 2000)
    }
  }

  const handleConfirmBurn = async () => {
    if (selectedCredit && currentUser) {
      const creditData = credits.find(c => c.id === selectedCredit)
      const confirmed = await requestWalletSign({
        action: 'Retire (Burn) Carbon Credit',
        details: `Permanently burning ${creditData?.metadata?.co2_tonnage || '—'} tCO₂e — Token #${creditData?.token_id || '—'}`,
        walletAddress: currentUser.wallet_address,
        gasEstimate: '0.0041 ETH (~$10.25)',
      })
      if (!confirmed) return

      burnCredit(currentUser.id, selectedCredit)
      setActionSuccess('burn')

      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      showTxToast({
        action: 'retire',
        txHash: mockTxHash,
        tokenId: creditData?.token_id,
        message: `${creditData?.metadata?.co2_tonnage || '—'} tCO₂e permanently retired`,
      })

      // Prepare retirement certificate data
      setRetiredCreditData({
        title: creditData?.metadata?.name || 'Carbon Credit',
        tonnage: creditData?.metadata?.co2_tonnage || 0,
        txHash: mockTxHash,
        tokenId: creditData?.token_id || '—',
      })

      setTimeout(() => {
        setShowBurnDialog(false)
        setSelectedCredit(null)
        setActionSuccess(null)
        setShowCertificate(true)
      }, 2000)
    }
  }

  const selectedCreditData = credits.find(c => c.id === selectedCredit)

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Leaf className="h-5 w-5 text-primary" />
            My Carbon Credits
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your carbon credit portfolio - list for sale or retire to offset emissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userCredits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Leaf className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Credits Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase credits from the marketplace to build your portfolio
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userCredits.map((credit) => {
                const listed = isListed(credit.id)
                return (
                  <Card key={credit.id} className="border-border bg-secondary/50">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                            {credit.metadata.co2_tonnage} tCO2e
                          </Badge>
                          {listed && (
                            <Badge variant="outline" className="border-chart-3/30 bg-chart-3/10 text-chart-3">
                              Listed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          Token #{credit.token_id}
                        </div>
                      </div>

                      {/* Credit Info */}
                      <h3 className="font-semibold text-foreground">{credit.metadata.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {credit.metadata.description}
                      </p>

                      {/* Details */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">NDVI:</span>
                          <span className="text-foreground">{credit.metadata?.ndvi_score?.toFixed(3) ?? 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{credit.metadata.location}</span>
                        </div>
                      </div>

                      {/* Contract Link */}
                      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="font-mono truncate">{credit.contract_address.slice(0, 10)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {credit.status === 'retired' ? (
                          <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-400">
                            <Flame className="mr-1 h-3 w-3" /> Burned
                          </Badge>
                        ) : (
                          <>
                            {!isListed(credit.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSellClick(credit.id)}
                                className="flex-1 border-border text-foreground hover:bg-secondary"
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                List for Sale
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBurnClick(credit.id)}
                              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                              disabled={isListed(credit.id)}
                            >
                              <Flame className="mr-2 h-4 w-4" />
                              Retire
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTimeline(showTimeline === credit.id ? null : credit.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Clock className="mr-1 h-4 w-4" />
                          Lineage
                        </Button>
                      </div>

                      {/* Asset Lineage Timeline (expanded) */}
                      {showTimeline === credit.id && (
                        <div className="mt-3 border-t border-border pt-3">
                          <CreditTimeline
                            creditId={credit.id}
                            tokenId={credit.token_id}
                            projectTitle={credit.metadata.name}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell Dialog */}
      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="bg-card border-border">
          {actionSuccess === 'sell' ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <DialogTitle className="text-xl text-foreground">Listed Successfully!</DialogTitle>
              <DialogDescription className="mt-2 text-center text-muted-foreground">
                Your carbon credit is now available on the marketplace.
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">List Credit for Sale</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Set your asking price for this carbon credit
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-border bg-secondary p-4">
                  <div className="mb-2 font-medium text-foreground">
                    {selectedCreditData?.metadata.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="h-4 w-4 text-primary" />
                    {selectedCreditData?.metadata.co2_tonnage} tCO2e
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Asking Price (ETH)</label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a competitive price based on the current market
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSellDialog(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSell}
                  disabled={!sellPrice || parseFloat(sellPrice) <= 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  List for Sale
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Burn Dialog */}
      <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
        <DialogContent className="bg-card border-border">
          {actionSuccess === 'burn' ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive">
                <Flame className="h-8 w-8 text-destructive-foreground" />
              </div>
              <DialogTitle className="text-xl text-foreground">Credit Retired!</DialogTitle>
              <DialogDescription className="mt-2 text-center text-muted-foreground">
                This carbon credit has been permanently retired.
                A proof-of-retirement certificate has been generated.
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Retire Carbon Credit</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  This action permanently burns the credit to offset emissions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <Flame className="h-5 w-5" />
                    <span className="font-medium">Warning: This action is irreversible</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once retired, this carbon credit will be permanently burned on-chain 
                    and cannot be traded or transferred.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary p-4">
                  <div className="mb-2 font-medium text-foreground">
                    {selectedCreditData?.metadata.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="h-4 w-4 text-primary" />
                    {selectedCreditData?.metadata.co2_tonnage} tCO2e will be offset
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBurnDialog(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBurn}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  Retire Credit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Retirement Certificate */}
      {showCertificate && retiredCreditData && (
        <RetirementCertificate
          projectTitle={retiredCreditData.title}
          tonnage={retiredCreditData.tonnage}
          retiredAt={new Date().toISOString()}
          txHash={retiredCreditData.txHash}
          tokenId={retiredCreditData.tokenId}
          ownerName={currentUser?.display_name || 'Investor'}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </>
  )
}
