"use client"

import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Leaf, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"

export function AllProposals() {
  const { proposals, users } = useAppStore()

  // Sort proposals by date (newest first)
  const sortedProposals = [...proposals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const getProducer = (producerId: string) => {
    return users.find(u => u.id === producerId)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Pending',
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
      year: 'numeric'
    })
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          All Proposals
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Complete history of all submitted proposals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Producer</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Credits</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">NDVI</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedProposals.map((proposal) => {
                const producer = getProducer(proposal.producer_id)
                const statusConfig = getStatusConfig(proposal.status)
                const ndviPasses = (proposal.sensor_data?.ndvi_score || 0) >= 0.6
                
                return (
                  <tr key={proposal.id} className="group hover:bg-secondary/30">
                    <td className="py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-foreground truncate">{proposal.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{proposal.description}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-foreground">{producer?.display_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Leaf className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{proposal.credit_quantity} tCO2e</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm font-medium ${ndviPasses ? 'text-primary' : 'text-chart-3'}`}>
                        {proposal.sensor_data?.ndvi_score?.toFixed(3) || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline" className={statusConfig.className}>
                        {statusConfig.icon}
                        <span className="ml-1">{statusConfig.label}</span>
                      </Badge>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {formatDate(proposal.submitted_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
