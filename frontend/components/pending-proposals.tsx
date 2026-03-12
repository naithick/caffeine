"use client"

import { useState } from "react"
import { Clock, CheckCircle2, XCircle, Leaf, User, Satellite, Thermometer, Droplets, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import type { Proposal } from "@/lib/types"

export function PendingProposals() {
  const { proposals, users, reviewProposal } = useAppStore()
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [remarks, setRemarks] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionComplete, setActionComplete] = useState(false)

  // Get pending proposals
  const pendingProposals = proposals.filter(p => p.status === 'submitted' || p.status === 'under_review')

  const getProducer = (producerId: string) => {
    return users.find(u => u.id === producerId)
  }

  const handleReview = (proposal: Proposal, action: 'approved' | 'rejected') => {
    setSelectedProposal(proposal)
    setDecision(action)
    setRemarks('')
    setActionComplete(false)
  }

  const { showTxToast, requestWalletSign } = useBlockchainUI()

  const handleConfirmDecision = async () => {
    if (!selectedProposal || !decision) return

    // Show wallet sign modal for on-chain actions
    if (decision === 'approved') {
      const currentUser = useAppStore.getState().currentUser
      const confirmed = await requestWalletSign({
        action: 'Mint Carbon Credit NFT',
        details: `Minting ${selectedProposal.credit_quantity} tCO₂e for "${selectedProposal.title}"`,
        walletAddress: currentUser?.wallet_address || '0xcccccccccccccccccccccccccccccccccccccccc',
        gasEstimate: 'Platform Subsidized',
      })
      if (!confirmed) return
    }

    setIsProcessing(true)
    
    setTimeout(() => {
      reviewProposal(selectedProposal.id, decision, remarks)
      setIsProcessing(false)
      setActionComplete(true)

      // Show tx hash toast for on-chain mint
      if (decision === 'approved') {
        const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        const mockTokenId = String(Math.floor(Math.random() * 100))
        showTxToast({
          action: 'mint',
          txHash: mockTxHash,
          tokenId: mockTokenId,
          message: `${selectedProposal.credit_quantity} tCO₂e minted for "${selectedProposal.title}"`,
        })
      }
      
      setTimeout(() => {
        setSelectedProposal(null)
        setDecision(null)
        setRemarks('')
        setActionComplete(false)
      }, 2000)
    }, 1500)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-chart-3" />
            Pending Review
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Review and verify submitted carbon credit proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">All Caught Up!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No proposals pending review at this time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProposals.map((proposal) => {
                const producer = getProducer(proposal.producer_id)
                const ndviPasses = (proposal.sensor_data?.ndvi_score || 0) >= 0.6
                
                return (
                  <div
                    key={proposal.id}
                    className="rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{proposal.title}</h3>
                          <Badge variant="outline" className="border-chart-3/30 bg-chart-3/10 text-chart-3">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {proposal.description}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      {/* Producer */}
                      <div className="flex items-center gap-2 rounded-lg bg-background/50 p-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Producer</div>
                          <div className="text-sm text-foreground">{producer?.display_name || 'Unknown'}</div>
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-2 rounded-lg bg-background/50 p-2">
                        <Leaf className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Credits</div>
                          <div className="text-sm text-foreground">{proposal.credit_quantity} tCO2e</div>
                        </div>
                      </div>

                      {/* NDVI Score */}
                      <div className="flex items-center gap-2 rounded-lg bg-background/50 p-2">
                        <Satellite className={`h-4 w-4 ${ndviPasses ? 'text-primary' : 'text-chart-3'}`} />
                        <div>
                          <div className="text-xs text-muted-foreground">NDVI Score</div>
                          <div className={`text-sm font-medium ${ndviPasses ? 'text-primary' : 'text-chart-3'}`}>
                            {proposal.sensor_data?.ndvi_score?.toFixed(3) ?? 'N/A'}
                            {!ndviPasses && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                          </div>
                        </div>
                      </div>

                      {/* Submitted */}
                      <div className="flex items-center gap-2 rounded-lg bg-background/50 p-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Submitted</div>
                          <div className="text-sm text-foreground">{formatDate(proposal.submitted_at)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sensor Data */}
                    {proposal.sensor_data && (
                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">Device: {proposal.sensor_data.device_id}</span>
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" /> {proposal.sensor_data.temperature_c}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" /> {proposal.sensor_data.humidity_pct}%
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        onClick={() => handleReview(proposal, 'approved')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve & Mint
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReview(proposal, 'rejected')}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Dialog */}
      <Dialog open={!!selectedProposal} onOpenChange={() => !isProcessing && setSelectedProposal(null)}>
        <DialogContent className="bg-card border-border">
          {actionComplete ? (
            <div className="flex flex-col items-center py-6">
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                decision === 'approved' ? 'bg-primary' : 'bg-destructive'
              }`}>
                {decision === 'approved' ? (
                  <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <XCircle className="h-8 w-8 text-destructive-foreground" />
                )}
              </div>
              <DialogTitle className="text-xl text-foreground">
                {decision === 'approved' ? 'Proposal Approved!' : 'Proposal Rejected'}
              </DialogTitle>
              <DialogDescription className="mt-2 text-center text-muted-foreground">
                {decision === 'approved' 
                  ? `${selectedProposal?.credit_quantity} tCO2e carbon credits have been minted to the producer's wallet.`
                  : 'The producer has been notified of the rejection.'
                }
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {decision === 'approved' ? 'Approve Proposal' : 'Reject Proposal'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {decision === 'approved'
                    ? 'This will mint carbon credits to the producer\'s wallet'
                    : 'Provide a reason for rejection'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Proposal Summary */}
                <div className="rounded-lg border border-border bg-secondary p-4">
                  <div className="font-medium text-foreground">{selectedProposal?.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="h-4 w-4 text-primary" />
                    {selectedProposal?.credit_quantity} tCO2e
                    <span className="mx-2">|</span>
                    NDVI: {selectedProposal?.sensor_data?.ndvi_score?.toFixed(3) ?? 'N/A'}
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {decision === 'approved' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                  </label>
                  <Textarea
                    placeholder={decision === 'approved' 
                      ? 'Add any notes for the approval...'
                      : 'Explain why this proposal was rejected...'
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                {decision === 'approved' && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">
                      {selectedProposal?.credit_quantity} carbon credits will be minted on-chain
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProposal(null)}
                  disabled={isProcessing}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDecision}
                  disabled={isProcessing || (decision === 'rejected' && !remarks.trim())}
                  className={decision === 'approved' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  }
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : decision === 'approved' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve & Mint
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Proposal
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
