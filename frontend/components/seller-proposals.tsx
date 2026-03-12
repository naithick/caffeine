"use client"

import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Leaf, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useAppStore } from "@/lib/store"
import type { Proposal } from "@/lib/types"

export function SellerProposals() {
  const { currentUser, proposals } = useAppStore()
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  // Get user's proposals
  const userProposals = proposals.filter(p => p.producer_id === currentUser?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Pending Review',
          icon: <Clock className="h-3.5 w-3.5" />,
          className: 'border-chart-3/30 bg-chart-3/10 text-chart-3'
        }
      case 'under_review':
        return {
          label: 'Under Review',
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          className: 'border-chart-2/30 bg-chart-2/10 text-chart-2'
        }
      case 'approved':
        return {
          label: 'Approved',
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          className: 'border-primary/30 bg-primary/10 text-primary'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          icon: <XCircle className="h-3.5 w-3.5" />,
          className: 'border-destructive/30 bg-destructive/10 text-destructive'
        }
      default:
        return {
          label: 'Draft',
          icon: <FileText className="h-3.5 w-3.5" />,
          className: 'border-muted/30 bg-muted/10 text-muted-foreground'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            My Proposals
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Track the status of your submitted carbon credit proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userProposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Proposals Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Submit your first carbon sequestration proposal to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userProposals.map((proposal) => {
                const statusConfig = getStatusConfig(proposal.status)
                return (
                  <div
                    key={proposal.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{proposal.title}</h3>
                        <Badge variant="outline" className={statusConfig.className}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.label}</span>
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {proposal.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Leaf className="h-4 w-4 text-primary" />
                          <span>{proposal.credit_quantity} tCO2e</span>
                        </div>
                        {proposal.sensor_data && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>NDVI: {proposal.sensor_data.ndvi_score.toFixed(3)}</span>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Submitted: {formatDate(proposal.submitted_at)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Detail Dialog */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedProposal?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Proposal submitted on {selectedProposal && formatDate(selectedProposal.submitted_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className={getStatusConfig(selectedProposal.status).className}>
                  {getStatusConfig(selectedProposal.status).icon}
                  <span className="ml-1">{getStatusConfig(selectedProposal.status).label}</span>
                </Badge>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <p className="text-sm text-muted-foreground rounded-lg bg-secondary p-3">
                  {selectedProposal.description}
                </p>
              </div>

              {/* Credit Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary p-3">
                  <div className="text-sm text-muted-foreground">Credit Quantity</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {selectedProposal.credit_quantity} tCO2e
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <div className="text-sm text-muted-foreground">NDVI Score</div>
                  <div className={`mt-1 text-lg font-semibold ${
                    (selectedProposal.sensor_data?.ndvi_score || 0) >= 0.6 ? 'text-primary' : 'text-chart-3'
                  }`}>
                    {selectedProposal.sensor_data?.ndvi_score.toFixed(3) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Sensor Data */}
              {selectedProposal.sensor_data && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Sensor Data</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xs text-muted-foreground">Device ID</div>
                      <div className="mt-1 text-sm font-mono text-foreground">
                        {selectedProposal.sensor_data.device_id}
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xs text-muted-foreground">Temperature</div>
                      <div className="mt-1 text-sm text-foreground">
                        {selectedProposal.sensor_data.temperature_c}°C
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <div className="text-xs text-muted-foreground">Humidity</div>
                      <div className="mt-1 text-sm text-foreground">
                        {selectedProposal.sensor_data.humidity_pct}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {selectedProposal.status === 'approved' && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Credits Minted!</div>
                    <p className="text-sm text-muted-foreground">
                      {selectedProposal.credit_quantity} tCO2e carbon credits have been minted to your wallet.
                    </p>
                  </div>
                </div>
              )}

              {selectedProposal.status === 'rejected' && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <div className="font-medium text-foreground">Proposal Rejected</div>
                    <p className="text-sm text-muted-foreground">
                      Your proposal did not meet the verification requirements. Please review and resubmit.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
