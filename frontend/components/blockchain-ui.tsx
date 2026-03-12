"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { CheckCircle2, ExternalLink, X, Loader2, Wallet, Flame, ShoppingCart, Tag } from "lucide-react"

// ═══════════════════════════════════════════════════════════════
//  Transaction Toast — shows tx hash after on-chain actions
// ═══════════════════════════════════════════════════════════════

interface TxToastData {
  id: string
  action: 'mint' | 'list' | 'buy' | 'retire'
  txHash: string
  tokenId?: string
  message: string
}

const actionConfig = {
  mint: { icon: CheckCircle2, label: 'NFT Minted', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  list: { icon: Tag, label: 'Listed on Marketplace', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  buy: { icon: ShoppingCart, label: 'Credit Purchased', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  retire: { icon: Flame, label: 'Credit Retired (Burned)', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
}

function TxToastItem({ toast, onDismiss }: { toast: TxToastData; onDismiss: () => void }) {
  const config = actionConfig[toast.action]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const shortHash = toast.txHash.length > 16
    ? `${toast.txHash.slice(0, 10)}...${toast.txHash.slice(-6)}`
    : toast.txHash

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-sm animate-in slide-in-from-right-5 ${config.bg}`}
      style={{ minWidth: 340 }}>
      <div className={`mt-0.5 ${config.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          {toast.tokenId && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/70">
              Token #{toast.tokenId}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-white/60">{toast.message}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-white/40">Tx:</span>
          <code className="text-[11px] font-mono text-white/50">{shortHash}</code>
          <ExternalLink className="h-3 w-3 text-white/30" />
        </div>
      </div>
      <button onClick={onDismiss} className="text-white/30 hover:text-white/60 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Wallet Sign Modal — mock MetaMask signing overlay
// ═══════════════════════════════════════════════════════════════

interface WalletSignRequest {
  action: string
  details: string
  walletAddress: string
  gasEstimate: string
  onConfirm: () => void
  onReject: () => void
}

function WalletSignOverlay({ request, onClose }: { request: WalletSignRequest; onClose: () => void }) {
  const [signing, setSigning] = useState(false)

  const handleConfirm = () => {
    setSigning(true)
    setTimeout(() => {
      request.onConfirm()
      onClose()
    }, 1200)
  }

  const shortWallet = request.walletAddress.length > 16
    ? `${request.walletAddress.slice(0, 8)}...${request.walletAddress.slice(-6)}`
    : request.walletAddress

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-[#3b4046] bg-[#1a1d23] shadow-2xl animate-in zoom-in-95">
        {/* MetaMask-style header */}
        <div className="flex items-center gap-3 border-b border-[#3b4046] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6851B]/20">
            <Wallet className="h-5 w-5 text-[#F6851B]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Confirm Transaction</div>
            <div className="text-xs text-white/50">MetaMask • Hardhat Network</div>
          </div>
        </div>

        {/* Action details */}
        <div className="space-y-3 px-5 py-4">
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">Action</div>
            <div className="mt-1 text-sm font-medium text-white">{request.action}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <div className="text-xs text-white/40 uppercase tracking-wider">Details</div>
            <div className="mt-1 text-sm text-white/80">{request.details}</div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/40">From</div>
              <div className="mt-1 text-xs font-mono text-white/70">{shortWallet}</div>
            </div>
            <div className="flex-1 rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/40">Est. Gas</div>
              <div className="mt-1 text-xs font-mono text-white/70">{request.gasEstimate}</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 border-t border-[#3b4046] px-5 py-4">
          <button
            onClick={() => { request.onReject(); onClose() }}
            disabled={signing}
            className="flex-1 rounded-lg border border-[#3b4046] bg-transparent py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleConfirm}
            disabled={signing}
            className="flex-1 rounded-lg bg-[#037DD6] py-2.5 text-sm font-medium text-white hover:bg-[#0370be] disabled:opacity-70"
          >
            {signing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing...
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Context Provider — wrap app to access toasts + wallet signing
// ═══════════════════════════════════════════════════════════════

interface BlockchainUIContextType {
  showTxToast: (data: Omit<TxToastData, 'id'>) => void
  requestWalletSign: (request: Omit<WalletSignRequest, 'onConfirm' | 'onReject'>) => Promise<boolean>
}

const BlockchainUIContext = createContext<BlockchainUIContextType | null>(null)

export function useBlockchainUI() {
  const ctx = useContext(BlockchainUIContext)
  if (!ctx) throw new Error('useBlockchainUI must be used within BlockchainUIProvider')
  return ctx
}

export function BlockchainUIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<TxToastData[]>([])
  const [walletRequest, setWalletRequest] = useState<WalletSignRequest | null>(null)

  const showTxToast = useCallback((data: Omit<TxToastData, 'id'>) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => [...prev, { ...data, id }])
  }, [])

  const requestWalletSign = useCallback((request: Omit<WalletSignRequest, 'onConfirm' | 'onReject'>) => {
    return new Promise<boolean>((resolve) => {
      setWalletRequest({
        ...request,
        onConfirm: () => resolve(true),
        onReject: () => resolve(false),
      })
    })
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <BlockchainUIContext.Provider value={{ showTxToast, requestWalletSign }}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2">
          {toasts.map(toast => (
            <TxToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
          ))}
        </div>
      )}

      {/* Wallet Sign Overlay */}
      {walletRequest && (
        <WalletSignOverlay request={walletRequest} onClose={() => setWalletRequest(null)} />
      )}
    </BlockchainUIContext.Provider>
  )
}
