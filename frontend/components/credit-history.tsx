"use client"

import { History, Leaf, Tag, ShoppingCart, Flame, ArrowRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"

interface CreditHistoryProps {
  showAll?: boolean
}

export function CreditHistory({ showAll = false }: CreditHistoryProps) {
  const { currentUser, history, credits } = useAppStore()

  // Filter history based on showAll or current user
  const relevantHistory = showAll 
    ? history
    : history.filter(h => {
        const credit = credits.find(c => c.id === h.credit_id)
        return credit?.owner_id === currentUser?.id || h.actor_id === currentUser?.id
      })

  // Sort by timestamp (newest first)
  const sortedHistory = [...relevantHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'minted':
        return {
          label: 'Minted',
          icon: <Leaf className="h-4 w-4" />,
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      case 'listed':
        return {
          label: 'Listed',
          icon: <Tag className="h-4 w-4" />,
          color: 'text-chart-3',
          bgColor: 'bg-chart-3/10'
        }
      case 'sold':
        return {
          label: 'Sold',
          icon: <ArrowRight className="h-4 w-4" />,
          color: 'text-chart-2',
          bgColor: 'bg-chart-2/10'
        }
      case 'purchased':
        return {
          label: 'Purchased',
          icon: <ShoppingCart className="h-4 w-4" />,
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      case 'retired':
        return {
          label: 'Retired',
          icon: <Flame className="h-4 w-4" />,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10'
        }
      case 'burned':
        return {
          label: 'Burned',
          icon: <Flame className="h-4 w-4" />,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10'
        }
      default:
        return {
          label: action,
          icon: <History className="h-4 w-4" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10'
        }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCreditName = (creditId: string) => {
    const credit = credits.find(c => c.id === creditId)
    return credit?.metadata.name || 'Unknown Credit'
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <History className="h-5 w-5 text-primary" />
          {showAll ? 'Platform Activity' : 'Credit History'}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {showAll 
            ? 'Complete history of all credit actions on the platform'
            : 'Track the lifecycle of your carbon credits'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No History Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {showAll
                ? 'No activity has been recorded on the platform'
                : 'Your credit history will appear here'
              }
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 h-full w-px bg-border" />
            
            <div className="space-y-6">
              {sortedHistory.map((entry, index) => {
                const actionConfig = getActionConfig(entry.action)
                
                return (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${actionConfig.bgColor} ${actionConfig.color}`}>
                      {actionConfig.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 rounded-lg border border-border bg-secondary/30 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`border-transparent ${actionConfig.bgColor} ${actionConfig.color}`}>
                              {actionConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm font-medium text-foreground">
                              {entry.actor_name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {' '}{entry.action === 'minted' && 'minted'}
                              {entry.action === 'listed' && 'listed for sale'}
                              {entry.action === 'sold' && 'sold'}
                              {entry.action === 'purchased' && 'purchased'}
                              {entry.action === 'retired' && 'retired'}
                              {entry.action === 'burned' && 'burned/retired'}{' '}
                            </span>
                            <span className="text-sm text-foreground">
                              {getCreditName(entry.credit_id)}
                            </span>
                          </div>
                          {entry.price_eth && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              Price: <span className="text-foreground">{parseFloat(entry.price_eth).toFixed(4)} ETH</span>
                            </div>
                          )}
                        </div>
                        
                        {entry.tx_hash && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <span className="truncate max-w-20">{entry.tx_hash}</span>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
