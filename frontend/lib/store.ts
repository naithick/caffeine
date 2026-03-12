"use client"

import { create } from 'zustand'
import type {
  User,
  UserRole,
  KYCStatus,
  Proposal,
  ProposalStatus,
  CarbonCredit,
  SellOrder,
  BuyOrder,
  Trade,
  CreditHistoryEntry,
} from './types'

// Generate unique IDs for local-only components (like notifications)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

const API_BASE = "http://localhost:5000/api"

export type AppView = 'landing' | 'register' | 'kyc' | 'role-select' | 'buyer' | 'seller' | 'admin' | 'company'

interface AppState {
  currentView: AppView
  setCurrentView: (view: AppView) => void
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  users: User[]
  updateUser: (userId: string, updates: Partial<User>) => void
  addUser: (user: User) => void
  getUser: (userId: string) => User | undefined
  proposals: Proposal[]
  addProposal: (proposal: Proposal) => void
  updateProposal: (proposalId: string, updates: Partial<Proposal>) => void
  credits: CarbonCredit[]
  addCredit: (credit: CarbonCredit) => void
  updateCredit: (creditId: string, updates: Partial<CarbonCredit>) => void
  sellOrders: SellOrder[]
  addSellOrder: (order: SellOrder) => void
  updateSellOrder: (orderId: string, updates: Partial<SellOrder>) => void
  buyOrders: BuyOrder[]
  addBuyOrder: (order: BuyOrder) => void
  updateBuyOrder: (orderId: string, updates: Partial<BuyOrder>) => void
  trades: Trade[]
  addTrade: (trade: Trade) => void
  history: CreditHistoryEntry[]
  addHistoryEntry: (entry: CreditHistoryEntry) => void
  notifications: { id: string; message: string; type: 'success' | 'info' | 'warning'; timestamp: string }[]
  addNotification: (message: string, type: 'success' | 'info' | 'warning') => void
  clearNotification: (id: string) => void
  
  // API Integration Actions
  fetchInitialData: () => Promise<void>
  fetchNotifications: (userId: string) => Promise<void>
  registerUser: (walletAddress: string, displayName: string) => Promise<User | undefined>
  submitKYCData: (data: { user_id: string; account_type: string; full_name?: string; company_name?: string; registration_number?: string; email: string; country: string }) => Promise<boolean>
  completeKYC: (userId: string) => void
  selectRole: (userId: string, role: UserRole) => void
  submitProposal: (producerId: string, title: string, description: string, quantity: number, sensorData: Proposal['sensor_data']) => Promise<Proposal | undefined>
  reviewProposal: (proposalId: string, decision: 'approved' | 'rejected', remarks: string) => Promise<void>
  listCreditForSale: (sellerId: string, creditId: string, priceEth: string) => Promise<SellOrder | undefined>
  buyCredit: (buyerId: string, sellOrderId: string) => Promise<void>
  burnCredit: (userId: string, creditId: string) => Promise<void>
  loginAsUser: (userId: string) => void
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  users: [],
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map((u) => u.id === userId ? { ...u, ...updates, updated_at: new Date().toISOString() } : u),
    currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates, updated_at: new Date().toISOString() } : state.currentUser
  })),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  getUser: (userId) => get().users.find(u => u.id === userId),
  proposals: [],
  addProposal: (proposal) => set((state) => ({ proposals: [...state.proposals, proposal] })),
  updateProposal: (proposalId, updates) => set((state) => ({
    proposals: state.proposals.map((p) => p.id === proposalId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)
  })),
  credits: [],
  addCredit: (credit) => set((state) => ({ credits: [...state.credits, credit] })),
  updateCredit: (creditId, updates) => set((state) => ({
    credits: state.credits.map((c) => c.id === creditId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)
  })),
  sellOrders: [],
  addSellOrder: (order) => set((state) => ({ sellOrders: [...state.sellOrders, order] })),
  updateSellOrder: (orderId, updates) => set((state) => ({
    sellOrders: state.sellOrders.map((o) => o.id === orderId ? { ...o, ...updates, updated_at: new Date().toISOString() } : o)
  })),
  buyOrders: [],
  addBuyOrder: (order) => set((state) => ({ buyOrders: [...state.buyOrders, order] })),
  updateBuyOrder: (orderId, updates) => set((state) => ({
    buyOrders: state.buyOrders.map((o) => o.id === orderId ? { ...o, ...updates } : o)
  })),
  trades: [],
  addTrade: (trade) => set((state) => ({ trades: [...state.trades, trade] })),
  history: [],
  addHistoryEntry: (entry) => set((state) => ({ history: [entry, ...state.history] })),
  notifications: [],
  addNotification: (message, type) => {
    const notif = { id: generateId(), message, type, timestamp: new Date().toISOString() };
    set((state) => ({ notifications: [...state.notifications, notif] }));
    // Also persist to backend if user is logged in
    const user = get().currentUser;
    if (user && !user.id.startsWith('mock-')) {
      fetch(`${API_BASE}/notifications`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, message, type })
      }).catch(() => {});
    }
  },
  clearNotification: (id) => {
    set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    // Also delete from backend
    fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  },

  // ==========================================
  // API Integrated Actions
  // ==========================================
  fetchInitialData: async () => {
    try {
      const pRes = await fetch(`${API_BASE}/proposals`).catch(() => null);
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.proposals) set({ proposals: pData.proposals });
      }
      
      const sRes = await fetch(`${API_BASE}/marketplace/sell`).catch(() => null);
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        if (sData.orders) set({ sellOrders: sData.orders });
      }

      const bRes = await fetch(`${API_BASE}/marketplace/buy`).catch(() => null);
      if (bRes && bRes.ok) {
        const bData = await bRes.json();
        if (bData.orders) set({ buyOrders: bData.orders });
      }
    } catch (e) {
      console.warn("Failed to fetch initial data. Backend might be offline.", e);
    }
  },

  fetchNotifications: async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/${userId}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.notifications) {
          set({ notifications: data.notifications.map((n: any) => ({ id: n.id, message: n.message, type: n.type, timestamp: n.created_at })) });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
    }
  },

  registerUser: async (walletAddress, displayName) => {
    try {
      const res = await fetch(`${API_BASE}/users/auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, role: 'buyer' }) // defaulting
      });
      const data = await res.json();
      if (data.user) {
        set((state) => ({
          users: [...state.users, data.user],
          currentUser: { ...data.user, display_name: displayName, balance_eth: "10.0", kyc_status: "pending", carbon_credits: 0 }
        }));
        return data.user;
      }
    } catch (e) {
      console.warn("Backend offline. Mocking user registration for UI simulation.");
      const mockUser = { 
        id: `mock-${Date.now()}`, 
        wallet_address: walletAddress, 
        role: 'buyer' as UserRole, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      set((state) => ({
        users: [...state.users, mockUser as User],
        currentUser: { 
          ...mockUser, 
          display_name: displayName, 
          balance_eth: "10.0", 
          kyc_status: "pending" as KYCStatus, 
          carbon_credits: 0 
        } as User
      }));
      return mockUser as User;
    }
  },

  submitKYCData: async (kycData) => {
    try {
      const res = await fetch(`${API_BASE}/kyc/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData)
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        console.log('KYC submitted to backend:', data.kyc?.id);
        return true;
      }
    } catch (e) {
      console.warn('KYC backend submission failed (offline mode)', e);
    }
    return true; // Still continue in offline mode
  },

  completeKYC: (userId) => {
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, kyc_status: 'verified' as KYCStatus } : u),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, kyc_status: 'verified' as KYCStatus } : state.currentUser
    }))
  },

  selectRole: (userId, role) => {
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, role } : u),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, role } : state.currentUser,
      currentView: role === 'buyer' ? 'buyer' : role === 'producer' ? 'seller' : role === 'company' ? 'company' : 'admin'
    }))
  },

  submitProposal: async (producerId, title, description, quantity, sensorData) => {
    try {
      const res = await fetch(`${API_BASE}/proposals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producer_id: producerId,
          title,
          description,
          commodity_type: 'carbon_credit',
          credit_quantity: quantity,
          sensor_data: sensorData
        })
      });
      const data = await res.json();
      if (data.proposal) {
        set((state) => ({
          proposals: [data.proposal, ...state.proposals],
          notifications: [...state.notifications, {
            id: generateId(), message: `New proposal "${title}" submitted`, type: 'info', timestamp: new Date().toISOString()
          }]
        }));
        return data.proposal;
      }
    } catch (e) {
      console.error(e);
    }
  },

  reviewProposal: async (proposalId, decision, remarks) => {
    try {
      const endpoint = decision === 'approved' ? '/verification/auto' : '/verification/review';
      const body = decision === 'approved' ? { proposal_id: proposalId } : { proposal_id: proposalId, decision, remarks };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.proposal || data.success) {
        const state = get();
        state.fetchInitialData(); // Refresh proposals dynamically from backend 
        set((s) => ({
          notifications: [...s.notifications, {
            id: generateId(), message: `Proposal ${decision} successfully`, type: decision === 'approved' ? 'success' : 'warning', timestamp: new Date().toISOString()
          }]
        }));
      }
    } catch (e) {
      console.error(e);
    }
  },

  listCreditForSale: async (sellerId, creditId, priceEth) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/sell`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, credit_id: creditId, asking_price_eth: priceEth, quantity: 1 })
      });
      const data = await res.json();
      if (data.sellOrder) {
        get().fetchInitialData(); // refresh market
        set((s) => ({
          notifications: [...s.notifications, { id: generateId(), message: `Credit listed for ${priceEth} ETH`, type: 'info', timestamp: new Date().toISOString() }]
        }));
        return data.sellOrder;
      }
    } catch (e) { console.error(e); }
  },

  buyCredit: async (buyerId, sellOrderId) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/buy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: buyerId, sell_order_id: sellOrderId, quantity: 1 })
      });
      const data = await res.json();
      if (data.buyOrder || data.trade) {
        get().fetchInitialData();
        set((s) => ({
          notifications: [...s.notifications, { id: generateId(), message: `Trade completed successfully!`, type: 'success', timestamp: new Date().toISOString() }]
        }));
      }
    } catch (e) { console.error(e); }
  },

  burnCredit: async (userId, creditId) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/retire`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: userId, credit_id: creditId })
      });
      const data = await res.json();
      if (data.retired) {
        get().fetchInitialData();
        set((s) => ({
          notifications: [...s.notifications, { id: generateId(), message: `Credit retired successfully. Certificate generated.`, type: 'success', timestamp: new Date().toISOString() }]
        }));
      }
    } catch (e) { console.error(e); }
  },

  loginAsUser: (userId) => {
    const user = get().users.find(u => u.id === userId)
    if (user) {
      set({
        currentUser: user,
        currentView: user.role === 'buyer' ? 'buyer' : user.role === 'producer' ? 'seller' : user.role === 'company' ? 'company' : 'admin'
      })
    }
  },

  loginWithEmail: async (email, _password) => {
    // Demo credentials mapping (email -> wallet address)
    const demoAccounts: Record<string, { wallet: string; name: string; role: UserRole }> = {
      'admin@greenforest.io': { wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', name: 'GreenForest Corp', role: 'producer' },
      'trade@ecotrade.com': { wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', name: 'EcoTrade Investments', role: 'buyer' },
      'audit@verraaudit.org': { wallet: '0xcccccccccccccccccccccccccccccccccccccccc', name: 'ITP Auditor Group', role: 'certification_body' },
      'ops@carbonneutral.co': { wallet: '0xdddddddddddddddddddddddddddddddddddddddd', name: 'CarbonNeutral Industries', role: 'buyer' },
    };

    const demoAccount = demoAccounts[email.toLowerCase()];
    if (!demoAccount) {
      return { success: false, error: 'Invalid email. Use a demo account.' };
    }

    try {
      // Try to authenticate via backend
      const res = await fetch(`${API_BASE}/users/auth`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: demoAccount.wallet, role: demoAccount.role })
      });
      const data = await res.json();
      if (data.user) {
        const user = {
          ...data.user,
          display_name: data.user.display_name || demoAccount.name,
          balance_eth: '10.0',
          kyc_status: 'verified' as KYCStatus,
          carbon_credits: 0,
        } as User;
        set({ currentUser: user, users: [...get().users.filter(u => u.id !== user.id), user] });
        // Fetch proposals and notifications
        await get().fetchInitialData();
        await get().fetchNotifications(user.id);
        return { success: true, role: (data.user.role || demoAccount.role) as UserRole };
      }
    } catch (e) {
      console.warn('Backend offline, using mock login');
    }

    // Offline fallback
    const mockUser = {
      id: `demo-${Date.now()}`,
      wallet_address: demoAccount.wallet,
      display_name: demoAccount.name,
      role: demoAccount.role,
      kyc_status: 'verified' as KYCStatus,
      balance_eth: '10.0',
      carbon_credits: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User;
    set({ currentUser: mockUser, users: [...get().users, mockUser] });
    return { success: true, role: demoAccount.role };
  },
}))
