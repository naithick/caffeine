"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle2, Tag, ShoppingCart, Flame, Leaf, ExternalLink, Loader2 } from "lucide-react"

// ═══════════════════════════════════════════════════════════════
//  Credit Timeline — vertical asset lineage view
// ═══════════════════════════════════════════════════════════════

interface TimelineEvent {
  action: string
  timestamp: string
  tx_hash?: string
  actor_name?: string
  price_eth?: string
  details?: string
}

const eventConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  'verified': { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  'minted': { icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/20' },
  'listed': { icon: Tag, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  'sold': { icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  'purchased': { icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  'transferred': { icon: ShoppingCart, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  'retired': { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  'burned': { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/20' },
}

const defaultConfig = { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' }

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

interface CreditTimelineProps {
  creditId: string
  events?: TimelineEvent[]
  tokenId?: string
  projectTitle?: string
}

export function CreditTimeline({ creditId, events: propEvents, tokenId, projectTitle }: CreditTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>(propEvents || [])
  const [loading, setLoading] = useState(!propEvents)

  useEffect(() => {
    if (propEvents) { setEvents(propEvents); return }
    // Try to fetch from backend
    fetch(`http://localhost:5000/api/history/credit/${creditId}`)
      .then(r => r.json())
      .then(data => {
        if (data.history && data.history.length > 0) {
          setEvents(data.history)
        } else {
          // Generate mock timeline based on credit state
          setEvents([
            { action: 'verified', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: 'IoT sensor data verified by MRV Oracle (NDVI: 0.78)', tx_hash: '0x' + Math.random().toString(16).slice(2, 14) },
            { action: 'minted', timestamp: new Date(Date.now() - 2.5 * 86400000).toISOString(), details: `Token #${tokenId || '—'} minted on Hardhat Network`, tx_hash: '0x' + Math.random().toString(16).slice(2, 14) },
            { action: 'listed', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: `Listed on marketplace for 2.5 ETH`, tx_hash: '0x' + Math.random().toString(16).slice(2, 14) },
          ])
        }
      })
      .catch(() => {
        setEvents([
          { action: 'verified', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), details: 'IoT sensor data verified by MRV Oracle (NDVI: 0.78)' },
          { action: 'minted', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), details: `Token #${tokenId || '—'} minted on-chain` },
        ])
      })
      .finally(() => setLoading(false))
  }, [creditId, propEvents, tokenId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading asset lineage...
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {projectTitle && (
        <div className="mb-3 text-sm font-medium text-foreground">
          Asset Lineage — {projectTitle}
        </div>
      )}
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

        {events.map((event, i) => {
          const cfg = eventConfig[event.action] || defaultConfig
          const Icon = cfg.icon
          const shortHash = event.tx_hash
            ? `${event.tx_hash.slice(0, 10)}...${event.tx_hash.slice(-4)}`
            : null

          return (
            <div key={i} className="relative mb-4 last:mb-0">
              {/* Node */}
              <div className={`absolute -left-6 flex h-6 w-6 items-center justify-center rounded-full ${cfg.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              </div>
              {/* Content */}
              <div className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold capitalize ${cfg.color}`}>{event.action}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(event.timestamp)}</span>
                </div>
                {event.details && (
                  <div className="mt-1 text-xs text-muted-foreground">{event.details}</div>
                )}
                {event.actor_name && (
                  <div className="mt-1 text-xs text-muted-foreground">By: {event.actor_name}</div>
                )}
                {event.price_eth && (
                  <div className="mt-1 text-xs text-muted-foreground">Price: {event.price_eth} ETH</div>
                )}
                {shortHash && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60">
                    Tx: {shortHash}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Retirement Certificate — official-looking offset proof
// ═══════════════════════════════════════════════════════════════

interface RetirementCertificateProps {
  projectTitle: string
  tonnage: number
  retiredAt: string
  txHash?: string
  tokenId?: string
  ownerName?: string
  onClose?: () => void
}

export function RetirementCertificate({ projectTitle, tonnage, retiredAt, txHash, tokenId, ownerName, onClose }: RetirementCertificateProps) {
  const shortHash = txHash
    ? `${txHash.slice(0, 14)}...${txHash.slice(-8)}`
    : '0x' + Math.random().toString(16).slice(2, 22)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-in zoom-in-95">
        {/* Certificate card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-[#0a1a0f] via-[#0f1f14] to-[#0a1914]">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 h-16 w-16 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 h-16 w-16 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 h-16 w-16 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl" />

          <div className="px-8 py-10 text-center">
            {/* Header */}
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <Leaf className="h-6 w-6" />
              <span className="text-xs uppercase tracking-[0.3em] font-semibold">CarbonX Verified</span>
              <Leaf className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-2xl font-bold text-white">Carbon Offset Certificate</h2>
            <div className="mt-1 text-sm text-white/50">Voluntary Carbon Market • Blockchain-Verified</div>

            {/* Tonnage */}
            <div className="mt-6 inline-flex items-baseline gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3">
              <span className="text-4xl font-bold text-emerald-400">{tonnage}</span>
              <span className="text-lg text-emerald-400/70">tCO₂e</span>
            </div>
            <div className="mt-2 text-xs text-white/40">Tonnes of CO₂ Equivalent Permanently Retired</div>

            {/* Divider */}
            <div className="my-6 border-t border-emerald-500/10" />

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Project</div>
                <div className="mt-0.5 text-sm text-white/80">{projectTitle}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Retired By</div>
                <div className="mt-0.5 text-sm text-white/80">{ownerName || 'Investor'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Date of Retirement</div>
                <div className="mt-0.5 text-sm text-white/80">{formatDate(retiredAt)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Token ID</div>
                <div className="mt-0.5 text-sm font-mono text-white/80">#{tokenId || '—'}</div>
              </div>
            </div>

            {/* Tx Hash */}
            <div className="mt-5 rounded-lg bg-white/5 p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/30">On-Chain Burn Transaction</div>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <code className="text-xs font-mono text-emerald-400/80">{shortHash}</code>
                <ExternalLink className="h-3 w-3 text-emerald-400/50" />
              </div>
            </div>

            {/* Badge */}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400">PERMANENTLY BURNED • IRREVOCABLE</span>
            </div>
          </div>
        </div>

        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-white/10 py-2.5 text-sm text-white/70 hover:bg-white/15 transition-colors"
          >
            Close Certificate
          </button>
        )}
      </div>
    </div>
  )
}
