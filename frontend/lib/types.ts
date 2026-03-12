export type UserRole = 'producer' | 'buyer' | 'certification_body' | 'company'

// KYC status
export type KYCStatus = 'pending' | 'in_progress' | 'verified' | 'rejected'

// Proposal status
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'

// Credit status
export type CreditStatus = 'minted' | 'listed' | 'transferred' | 'retired' | 'revoked'

// Order status
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled'

// Trade status
export type TradeStatus = 'matched' | 'settling' | 'settled' | 'failed'

// User interface
export interface User {
  id: string
  wallet_address: string
  display_name: string | null
  role: UserRole
  kyc_status: KYCStatus
  balance_eth: string
  carbon_credits: number
  created_at: string
  updated_at: string
}

// Proposal interface
export interface Proposal {
  id: string
  producer_id: string
  producer_name?: string
  title: string
  description: string
  commodity_type: string
  credit_quantity: number
  supporting_documents?: {
    land_ownership?: string
    intent_certificate?: string
    financial_history?: string
  }
  proof_of_intent?: string
  proof_of_value?: string
  sensor_data?: {
    device_id: string
    co2_sequestered_tons: number
    temperature_c: number
    humidity_pct: number
    ndvi_score: number
    recorded_at: string
  }
  status: ProposalStatus
  submitted_at: string
  created_at: string
  updated_at: string
}

// Carbon Credit interface
export interface CarbonCredit {
  id: string
  proposal_id: string
  owner_id: string
  owner_name?: string
  token_id: string
  contract_address: string
  metadata: {
    name: string
    description: string
    ipfs_cid: string
    ndvi_score: number
    co2_tonnage: number
    location: string
    issued_at: string
  }
  status: CreditStatus
  minted_at: string
  retired_at: string | null
  created_at: string
  updated_at: string
}

// Sell Order interface
export interface SellOrder {
  id: string
  seller_id: string
  seller_name?: string
  credit_id: string
  credit?: CarbonCredit
  asking_price_eth: string
  quantity: number
  status: OrderStatus
  listed_at: string
  created_at: string
  updated_at: string
}

// Buy Order interface
export interface BuyOrder {
  id: string
  buyer_id: string
  buyer_name?: string
  credit_id: string
  bid_price_eth: string
  quantity: number
  status: OrderStatus
  escrow_tx_hash: string | null
  placed_at: string
  created_at: string
  updated_at: string
}

// Trade interface
export interface Trade {
  id: string
  sell_order_id: string
  buy_order_id: string
  credit_id: string
  execution_price_eth: string
  quantity: number
  status: TradeStatus
  settlement_tx_hash: string | null
  matched_at: string
  settled_at: string | null
}

// History entry for credit lifecycle
export interface CreditHistoryEntry {
  id: string
  credit_id: string
  action: 'minted' | 'listed' | 'sold' | 'purchased' | 'retired' | 'burned'
  actor_id: string
  actor_name: string
  price_eth?: string
  timestamp: string
  tx_hash?: string
}
