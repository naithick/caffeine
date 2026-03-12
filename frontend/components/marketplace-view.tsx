"use client"

import { useState } from "react"
import { ShoppingCart, Leaf, MapPin, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export function MarketplaceView() {
  const { currentUser, sellOrders, credits, buyCredit } = useAppStore()
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Get open sell orders with credit details
  const openOrders = sellOrders
    .filter(o => o.status === 'open')
    .map(order => {
      const credit = credits.find(c => c.id === order.credit_id)
      return { ...order, credit }
    })

  const handleBuyClick = (orderId: string) => {
    setSelectedOrder(orderId)
    setShowConfirmDialog(true)
    setPurchaseSuccess(false)
  }

  const { showTxToast, requestWalletSign } = useBlockchainUI()

  const handleConfirmPurchase = async () => {
    if (selectedOrder && currentUser) {
      const orderData = openOrders.find(o => o.id === selectedOrder)
      // Show wallet sign modal
      const confirmed = await requestWalletSign({
        action: 'Purchase Carbon Credit',
        details: `Buying ${orderData?.credit?.metadata?.co2_tonnage || '—'} tCO₂e for ${orderData?.asking_price_eth || '—'} ETH`,
        walletAddress: currentUser.wallet_address,
        gasEstimate: '0.0051 ETH (~$12.75)',
      })
      if (!confirmed) return

      buyCredit(currentUser.id, selectedOrder)
      setPurchaseSuccess(true)

      // Show tx hash toast
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      showTxToast({
        action: 'buy',
        txHash: mockTxHash,
        tokenId: orderData?.credit?.token_id,
        message: `Purchased ${orderData?.credit?.metadata?.co2_tonnage || '—'} tCO₂e credit`,
      })

      setTimeout(() => {
        setShowConfirmDialog(false)
        setSelectedOrder(null)
        setPurchaseSuccess(false)
      }, 2000)
    }
  }

  const selectedOrderData = openOrders.find(o => o.id === selectedOrder)
  const userBalance = parseFloat(currentUser?.balance_eth || '0')
  const orderPrice = parseFloat(selectedOrderData?.asking_price_eth || '0')
  const canAfford = userBalance >= orderPrice

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Available Carbon Credits
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Browse and purchase verified carbon credits from producers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Credits Available</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back later for new listings from verified producers
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openOrders.map((order) => (
                <Card key={order.id} className="border-border bg-secondary/50 overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                        {order.credit?.metadata.co2_tonnage || 1} tCO2e
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Verified
                      </div>
                    </div>

                    {/* Credit Info */}
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {order.credit?.metadata.name || 'Carbon Credit'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {order.credit?.metadata.description || 'Verified carbon credit'}
                    </p>

                    {/* Details */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Leaf className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">NDVI Score:</span>
                        <span className="font-medium text-foreground">
                          {order.credit?.metadata.ndvi_score?.toFixed(3) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">
                          {order.credit?.metadata.location || 'Unknown location'}
                        </span>
                      </div>
                    </div>

                    {/* Seller */}
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/50 p-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Leaf className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground truncate">
                        {order.seller_name || 'Anonymous Seller'}
                      </span>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Price</div>
                        <div className="text-lg font-bold text-foreground">
                          {parseFloat(order.asking_price_eth).toFixed(4)} ETH
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((parseFloat(order.asking_price_eth) / (order.credit?.metadata.co2_tonnage || 1)) * 100).toFixed(2)} ETH/100t
                        </div>
                      </div>
                      <Button
                        onClick={() => handleBuyClick(order.id)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={order.seller_id === currentUser?.id}
                      >
                        {order.seller_id === currentUser?.id ? 'Your Listing' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border">
          {purchaseSuccess ? (
            <div className="flex flex-col items-center py-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <DialogTitle className="text-xl text-foreground">Purchase Complete!</DialogTitle>
              <DialogDescription className="mt-2 text-center text-muted-foreground">
                The carbon credit has been transferred to your wallet.
                Your balance has been updated.
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Confirm Purchase</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Review the details before completing your purchase
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Credit Details */}
                <div className="rounded-lg border border-border bg-secondary p-4">
                  <div className="mb-2 font-medium text-foreground">
                    {selectedOrderData?.credit?.metadata.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Leaf className="h-4 w-4 text-primary" />
                    {selectedOrderData?.credit?.metadata.co2_tonnage} tCO2e
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Credit Price</span>
                    <span className="text-foreground">{orderPrice.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Balance</span>
                    <span className="text-foreground">{userBalance.toFixed(4)} ETH</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">After Purchase</span>
                      <span className={`font-medium ${canAfford ? 'text-foreground' : 'text-destructive'}`}>
                        {(userBalance - orderPrice).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                {!canAfford && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Insufficient balance to complete this purchase
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmPurchase}
                  disabled={!canAfford}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Confirm Purchase
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
