"use client";

import { useState, useCallback, useRef } from "react";

// ── Configuration ──────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Hardhat default test wallets
const PRODUCER_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const CERTIFIER_WALLET = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const BUYER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// ── Types ──────────────────────────────────────────────────
interface Stage {
  phase: string;
  title: string;
  desc: string;
  impact: string;
  imgUrl: string;
  techPayload: string;
}

type LiveStatus = "idle" | "running" | "done" | "error";

interface CreditState {
  status: string;
  producer: string;
  owner: string;
  project: string;
  credits: string;
  certifier: string;
  tokenId: string;
  txHash: string;
  ipfsCid: string;
  price: string;
  buyer: string;
}

// ── Credit lifecycle phases (for the mini state-machine bar) ─
const CREDIT_PHASES = [
  "REG",
  "PRO",
  "VER",
  "MNT",
  "LST",
  "MKT",
  "SET",
  "TRF",
];

const defaultCredit: CreditState = {
  status: "AWAITING",
  producer: "—",
  owner: "—",
  project: "—",
  credits: "—",
  certifier: "—",
  tokenId: "—",
  txHash: "—",
  ipfsCid: "—",
  price: "—",
  buyer: "—",
};

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ── Static data (fallback when backend is not running) ─────
const lifecycleStages: Stage[] = [
  {
    phase: "STEP 1: CAPTURE",
    title: "Project Genesis",
    desc: "Sensors log physical carbon data. Automated IoT ingestion guarantees immutable baseline metrics, replacing manual data entry.",
    impact: "+50 Tons Sequestered",
    imgUrl:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop",
    techPayload: `POST  /api/users/auth
  wallet_address  0xf39F...2266
  role            producer

> 201 Created
> User registered on platform`,
  },
  {
    phase: "STEP 2: AUDIT",
    title: "Oracle Verification",
    desc: "A zero-knowledge MRV Oracle cross-references satellite NDVI imagery to cryptographically verify the claim. This eliminates the 64% failure rate of human auditors.",
    impact: "100% Trustless",
    imgUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=600&fit=crop",
    techPayload: `POST  /api/proposals
  title           Reforestation — Western Ghats
  credit_quantity 150
  co2_absorbed    152.7 tons

> 201 Created
> Proposal submitted for review`,
  },
  {
    phase: "STEP 3: STORAGE",
    title: "Immutable Record",
    desc: "The verified report is permanently sealed on the decentralized web via IPFS, ensuring environmental records can never be manipulated by bad actors.",
    impact: "Zero Tampering Risk",
    imgUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop",
    techPayload: `POST  /api/verification/review
  proposal_id     ...
  certifier_id    ...
  decision        approved

> 200 OK
> NFT minted on-chain
> tx    0xabc123...
> token #1`,
  },
  {
    phase: "STEP 4: ASSET",
    title: "Tokenization",
    desc: "The verified physical trees are minted as an ERC-721 NFT. The underlying environmental asset is now a liquid, tradable digital entity.",
    impact: "Asset Bridged",
    imgUrl:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop",
    techPayload: `GET  /api/proposals

> status    approved
> credit    minted on-chain
> ipfs      CID attached to metadata`,
  },
  {
    phase: "STEP 5: SECURITY",
    title: "Smart Contract Escrow",
    desc: "The asset is locked in a decentralized vault. The smart contract ensures the buyer's capital is protected until atomic transfer occurs.",
    impact: "Self-Custodial",
    imgUrl:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop",
    techPayload: `POST  /api/marketplace/sell
  seller_id        ...
  credit_id        ...
  asking_price_eth 1.0

> 201 Created
> Sell order open`,
  },
  {
    phase: "STEP 6: MARKET",
    title: "Order Book Listing",
    desc: "The asset is indexed in our high-speed off-chain matching engine. This provides a Web2 user experience while deferring execution to the blockchain.",
    impact: "Gas-Optimized",
    imgUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
    techPayload: `GET  /api/marketplace/sell

> 1 active order
> credit  ...
> price   1.0 ETH
> status  open`,
  },
  {
    phase: "STEP 7: SETTLEMENT",
    title: "Atomic Swap",
    desc: "The buyer sends ETH, and the smart contract simultaneously swaps the funds for the NFT. Zero settlement delays and zero counterparty risk.",
    impact: "Instant Settlement",
    imgUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop",
    techPayload: `POST  /api/marketplace/buy
  buyer_id       ...
  credit_id      ...
  bid_price_eth  1.0

> 201 Created
> Buy order placed`,
  },
  {
    phase: "STEP 8: SYNC",
    title: "Ledger Settlement",
    desc: "Our backend event listener captures the on-chain settlement and instantly updates the Web2 interface, permanently retiring the credit to prevent double-spending.",
    impact: "Double-Spend Prevented",
    imgUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    techPayload: `GET  /api/proposals

> All records synced
> credit.status  transferred
> Trade complete`,
  },
];

// ── Clean output formatter (no braces, no brackets) ────────
function flattenToLines(
  data: unknown,
  indent: number = 0,
  maxDepth: number = 3,
): string {
  const pad = "  ".repeat(indent);
  if (data === null || data === undefined) return `${pad}null`;
  if (typeof data !== "object") return `${pad}${data}`;
  if (indent >= maxDepth) return `${pad}...`;

  if (Array.isArray(data)) {
    if (data.length === 0) return `${pad}(empty)`;
    return data
      .map(
        (item, i) =>
          `${pad}[${i}]\n${flattenToLines(item, indent + 1, maxDepth)}`,
      )
      .join("\n");
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) return `${pad}(empty)`;

  // Find the longest key for alignment
  const maxKey = Math.min(
    20,
    Math.max(...entries.map(([k]) => k.length)),
  );

  return entries
    .map(([k, v]) => {
      if (typeof v === "object" && v !== null) {
        return `${pad}${k}:\n${flattenToLines(v, indent + 1, maxDepth)}`;
      }
      const padded = k.padEnd(maxKey);
      return `${pad}${padded}  ${v}`;
    })
    .join("\n");
}

function formatResponse(
  method: string,
  path: string,
  body: object | null,
  status: number,
  data: unknown,
): string {
  let out = `${method}  ${path}\n`;
  if (body) {
    out += flattenToLines(body, 1, 2) + "\n";
  }
  out += `\n> ${status} ${status < 300 ? "OK" : "ERROR"}\n\n`;
  out += flattenToLines(data, 0, 3);
  return out;
}

// ── API helper ─────────────────────────────────────────────
async function apiFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Component ──────────────────────────────────────────────
export default function DemoVisualizer() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [liveLogs, setLiveLogs] = useState<Record<number, string>>({});
  const [liveError, setLiveError] = useState<string>("");
  const [creditState, setCreditState] = useState<CreditState>(defaultCredit);
  const [isPaused, setIsPaused] = useState(false);

  const abortRef = useRef(false);
  const pausedRef = useRef(false);
  const resumeRef = useRef<(() => void) | null>(null);

  const handlePrev = () => setActiveStep((p) => (p > 0 ? p - 1 : p));
  const handleNext = () =>
    setActiveStep((p) => (p < lifecycleStages.length - 1 ? p + 1 : p));

  const current = lifecycleStages[activeStep];

  const updateCredit = useCallback((updates: Partial<CreditState>) => {
    setCreditState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Pause / Resume toggle ────────────────────────────────
  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      // Resume
      pausedRef.current = false;
      setIsPaused(false);
      resumeRef.current?.();
      resumeRef.current = null;
    } else {
      // Pause
      pausedRef.current = true;
      setIsPaused(true);
    }
  }, []);

  // Wait helper that also honors pause
  const waitStep = useCallback(async (ms: number) => {
    await sleep(ms);
    if (pausedRef.current) {
      await new Promise<void>((resolve) => {
        resumeRef.current = resolve;
      });
    }
  }, []);

  // ── Live demo orchestrator ───────────────────────────────
  const runLiveDemo = useCallback(async () => {
    abortRef.current = false;
    pausedRef.current = false;
    setIsPaused(false);
    setLiveStatus("running");
    setLiveLogs({});
    setLiveError("");
    setActiveStep(0);
    setCreditState({ ...defaultCredit, status: "INITIALIZING" });

    const log = (step: number, text: string) => {
      setLiveLogs((prev) => ({ ...prev, [step]: text }));
    };

    try {
      // STEP 1: Register Producer
      setActiveStep(0);
      const authBody = { wallet_address: PRODUCER_WALLET, role: "producer" };
      const auth = await apiFetch("POST", "/users/auth", authBody);
      if (!auth.ok)
        throw new Error(`Auth failed: ${JSON.stringify(auth.data)}`);
      const producerId = auth.data.user.id;
      log(
        0,
        formatResponse(
          "POST",
          "/users/auth",
          authBody,
          auth.status,
          auth.data,
        ),
      );
      updateCredit({
        status: "REGISTERED",
        producer: shortAddr(PRODUCER_WALLET),
        owner: shortAddr(PRODUCER_WALLET),
      });
      if (abortRef.current) return;
      await waitStep(1200);

      // STEP 2: Submit Proposal
      setActiveStep(1);
      const proposalBody = {
        producer_id: producerId,
        title: "Reforestation — Western Ghats",
        description:
          "500 hectares of native tree plantation with verified carbon sequestration.",
        credit_quantity: 150,
        sensor_data: {
          station_id: "WG-IOT-042",
          readings: [
            {
              metric: "co2_absorbed_tons",
              value: 152.7,
              timestamp: new Date().toISOString(),
            },
            {
              metric: "canopy_density_pct",
              value: 84.1,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
      const proposal = await apiFetch("POST", "/proposals", proposalBody);
      if (!proposal.ok)
        throw new Error(`Proposal failed: ${JSON.stringify(proposal.data)}`);
      const proposalId = proposal.data.proposal.id;
      log(
        1,
        formatResponse(
          "POST",
          "/proposals",
          proposalBody,
          proposal.status,
          proposal.data,
        ),
      );
      updateCredit({
        status: "PROPOSED",
        project: "Western Ghats Reforestation",
        credits: "150 Tons CO\u2082",
      });
      if (abortRef.current) return;
      await waitStep(1500);

      // STEP 3: Certifier Review + On-chain Mint
      setActiveStep(2);
      const certAuth = await apiFetch("POST", "/users/auth", {
        wallet_address: CERTIFIER_WALLET,
        role: "certification_body",
      });
      if (!certAuth.ok)
        throw new Error(
          `Certifier auth failed: ${JSON.stringify(certAuth.data)}`,
        );
      const certifierId = certAuth.data.user.id;

      const reviewBody = {
        proposal_id: proposalId,
        certifier_id: certifierId,
        decision: "approved",
      };
      const review = await apiFetch(
        "POST",
        "/verification/review",
        reviewBody,
      );
      let reviewLog = `POST  /users/auth (certifier)\n> ${certAuth.status} — Certifier: ${certifierId}\n\n`;
      reviewLog += formatResponse(
        "POST",
        "/verification/review",
        reviewBody,
        review.status,
        review.data,
      );
      log(2, reviewLog);
      if (abortRef.current) return;

      const creditId = review.data?.credit?.id;
      const txHash = review.data?.blockchain?.txHash || "N/A";
      const tokenId = review.data?.blockchain?.tokenId ?? "N/A";
      const ipfsCid =
        review.data?.credit?.ipfs_url || review.data?.ipfs?.cid || "—";

      updateCredit({
        status: "VERIFIED",
        certifier: shortAddr(CERTIFIER_WALLET),
        tokenId: tokenId !== "N/A" ? `#${tokenId}` : "pending",
        txHash: txHash !== "N/A" ? shortAddr(txHash) : "pending",
        ipfsCid:
          typeof ipfsCid === "string" && ipfsCid !== "—"
            ? shortAddr(ipfsCid)
            : "—",
      });
      await waitStep(1500);

      // STEP 4: Verify Minted Asset
      setActiveStep(3);
      const proposals = await apiFetch("GET", "/proposals");
      let step4Log = formatResponse(
        "GET",
        "/proposals",
        null,
        proposals.status,
        proposals.data,
      );
      step4Log += `\n\n--- Mint Summary ---\ntx_hash    ${txHash}\ntoken_id   ${tokenId}\ncredit     ${creditId || "see review response"}`;
      log(3, step4Log);
      updateCredit({ status: "MINTED" });
      if (abortRef.current) return;
      await waitStep(1200);

      // STEP 5: Create Sell Order
      setActiveStep(4);
      if (creditId) {
        const sellBody = {
          seller_id: producerId,
          credit_id: creditId,
          asking_price_eth: 1.0,
        };
        const sell = await apiFetch("POST", "/marketplace/sell", sellBody);
        log(
          4,
          formatResponse(
            "POST",
            "/marketplace/sell",
            sellBody,
            sell.status,
            sell.data,
          ),
        );
        updateCredit({ status: "LISTED", price: "1.0 ETH" });
      } else {
        log(
          4,
          "// Skipped — no credit_id from review step\n// Review endpoint may not return credit in all configs",
        );
        updateCredit({ status: "LISTED", price: "—" });
      }
      if (abortRef.current) return;
      await waitStep(1200);

      // STEP 6: View Marketplace
      setActiveStep(5);
      const orders = await apiFetch("GET", "/marketplace/sell");
      log(
        5,
        formatResponse(
          "GET",
          "/marketplace/sell",
          null,
          orders.status,
          orders.data,
        ),
      );
      updateCredit({ status: "ON MARKET" });
      if (abortRef.current) return;
      await waitStep(1200);

      // STEP 7: Buyer Places Buy Order
      setActiveStep(6);
      const buyerAuth = await apiFetch("POST", "/users/auth", {
        wallet_address: BUYER_WALLET,
        role: "buyer",
      });
      if (!buyerAuth.ok)
        throw new Error(
          `Buyer auth failed: ${JSON.stringify(buyerAuth.data)}`,
        );
      const buyerId = buyerAuth.data.user.id;

      if (creditId) {
        const buyBody = {
          buyer_id: buyerId,
          credit_id: creditId,
          bid_price_eth: 1.0,
        };
        const buy = await apiFetch("POST", "/marketplace/buy", buyBody);
        let buyLog = `POST  /users/auth (buyer)\n> ${buyerAuth.status} — Buyer: ${buyerId}\n\n`;
        buyLog += formatResponse(
          "POST",
          "/marketplace/buy",
          buyBody,
          buy.status,
          buy.data,
        );
        log(6, buyLog);
      } else {
        log(
          6,
          `POST  /users/auth (buyer)\n> ${buyerAuth.status} — Buyer: ${buyerId}\n\n// Buy order skipped — no credit_id`,
        );
      }
      updateCredit({
        status: "SETTLING",
        buyer: shortAddr(BUYER_WALLET),
      });
      if (abortRef.current) return;
      await waitStep(1200);

      // STEP 8: Final State
      setActiveStep(7);
      const finalProposals = await apiFetch("GET", "/proposals");
      const finalOrders = await apiFetch("GET", "/marketplace/sell");
      let syncLog = "--- Final System State ---\n\n";
      syncLog += `Proposals:\n${flattenToLines(finalProposals.data, 1, 3)}\n\n`;
      syncLog += `Sell Orders:\n${flattenToLines(finalOrders.data, 1, 3)}\n\n`;
      syncLog += `--- LIFECYCLE COMPLETE ---`;
      log(7, syncLog);
      updateCredit({
        status: "TRANSFERRED",
        owner: shortAddr(BUYER_WALLET),
      });

      setLiveStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLiveError(msg);
      setLiveStatus("error");
    }
  }, [updateCredit, waitStep]);

  const resetDemo = () => {
    abortRef.current = true;
    pausedRef.current = false;
    setIsPaused(false);
    setLiveStatus("idle");
    setLiveLogs({});
    setLiveError("");
    setCreditState(defaultCredit);
    setActiveStep(0);
  };

  // Terminal content: live data if available, else static fallback
  const terminalContent = liveLogs[activeStep] || current.techPayload;
  const isLive = liveStatus === "running" || liveStatus === "done";

  return (
    <div className="min-h-screen bg-[#9FE870] p-8 text-[#1A3614] font-sans flex flex-col">
      {/* ── Controls ── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight border-b-4 border-[#1A3614] pb-2">
          CARBON CREDIT LIFECYCLE
        </h1>
        <div className="flex items-center gap-3">
          {/* Live Demo Button */}
          {liveStatus === "idle" && (
            <button
              onClick={runLiveDemo}
              className="border-2 border-[#1A3614] bg-[#1A3614] text-[#9FE870] px-5 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_#1A3614] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all animate-pulse"
            >
              RUN LIVE DEMO
            </button>
          )}
          {liveStatus === "running" && (
            <>
              <button
                onClick={togglePause}
                className={[
                  "border-2 border-[#1A3614] px-5 py-2 text-sm font-black uppercase transition-all",
                  isPaused
                    ? "bg-[#9FE870] text-[#1A3614] shadow-[4px_4px_0px_#1A3614] animate-pulse"
                    : "bg-[#F2F5F1] text-[#1A3614] shadow-[4px_4px_0px_#1A3614] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
                ].join(" ")}
              >
                {isPaused ? "RESUME" : "PAUSE"}
              </button>
              <span className="border-2 border-[#1A3614] bg-[#1A3614] text-[#9FE870] px-5 py-2 text-sm font-black uppercase tracking-widest">
                {isPaused ? "PAUSED" : "LIVE"}
                <span
                  className={[
                    "inline-block w-2 h-2 rounded-full ml-2",
                    isPaused
                      ? "bg-yellow-400"
                      : "bg-red-500 animate-pulse",
                  ].join(" ")}
                />
              </span>
            </>
          )}
          {(liveStatus === "done" || liveStatus === "error") && (
            <button
              onClick={resetDemo}
              className="border-2 border-[#1A3614] bg-[#F2F5F1] text-[#1A3614] px-5 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_#1A3614] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              RESET
            </button>
          )}

          <span className="font-mono text-sm font-bold">
            {activeStep + 1} / {lifecycleStages.length}
          </span>
          <button
            onClick={handlePrev}
            disabled={activeStep === 0}
            className={[
              "border-2 border-[#1A3614] px-5 py-2 text-sm font-black uppercase",
              activeStep === 0
                ? "opacity-30 cursor-not-allowed bg-[#9FE870]"
                : "bg-[#1A3614] text-[#9FE870] shadow-[4px_4px_0px_#1A3614] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
            ].join(" ")}
          >
            PREV
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep === lifecycleStages.length - 1}
            className={[
              "border-2 border-[#1A3614] px-5 py-2 text-sm font-black uppercase",
              activeStep === lifecycleStages.length - 1
                ? "opacity-30 cursor-not-allowed bg-[#9FE870]"
                : "bg-[#1A3614] text-[#9FE870] shadow-[4px_4px_0px_#1A3614] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
            ].join(" ")}
          >
            NEXT
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {liveError && (
        <div className="mb-4 border-2 border-red-800 bg-red-100 text-red-900 p-4 text-sm font-mono">
          LIVE ERROR: {liveError}
        </div>
      )}

      {/* ── Timeline Diagram ── */}
      <div className="relative flex items-start justify-between mb-8 px-6">
        <div className="absolute left-10 right-10 top-6 h-[3px] bg-[#1A3614]" />

        {lifecycleStages.map((stage, index) => {
          const isActive = index === activeStep;
          const isPast = index < activeStep;
          const isFuture = index > activeStep;
          const hasLiveData = !!liveLogs[index];

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 z-10"
            >
              <button
                onClick={() => setActiveStep(index)}
                className={[
                  "flex items-center justify-center w-12 h-12 border-2 text-sm font-black transition-all duration-200",
                  isActive
                    ? "bg-[#1A3614] text-[#9FE870] border-[#1A3614] shadow-[6px_6px_0px_#1A3614] scale-110"
                    : "",
                  isPast && !isActive
                    ? "bg-[#F2F5F1] text-[#1A3614] border-[#1A3614] shadow-[4px_4px_0px_#1A3614]"
                    : "",
                  isFuture && !isActive
                    ? "bg-[#F2F5F1] text-[#1A3614] border-dashed border-[#1A3614] opacity-40"
                    : "",
                  hasLiveData && !isActive
                    ? "ring-2 ring-[#9FE870] ring-offset-2 ring-offset-[#9FE870]"
                    : "",
                ].join(" ")}
              >
                {hasLiveData && !isActive ? "\u2713" : index + 1}
              </button>
              <span
                className={[
                  "text-[10px] font-black uppercase tracking-tight text-center w-16",
                  isActive
                    ? "opacity-100"
                    : isPast
                      ? "opacity-60"
                      : "opacity-25",
                ].join(" ")}
              >
                {stage.phase.replace(/^STEP \d+:\s*/i, "")}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Main Card: two-column Mullet layout ── */}
      <div className="flex-1 flex flex-row border-2 border-[#1A3614] shadow-[6px_6px_0px_#1A3614] overflow-hidden min-h-[360px]">
        {/* Left column — Live: Credit State Monitor / Static: Image */}
        <div className="w-1/2 relative bg-[#1A3614] border-r-4 border-[#1A3614] overflow-hidden flex flex-col">
          {isLive ? (
            /* ── LIVE: Carbon Credit State Card ── */
            <div className="flex-1 p-6 flex flex-col text-[#9FE870] font-mono">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#9FE870] rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Credit Monitor
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-widest opacity-40">
                  {isPaused ? "PAUSED" : "LIVE"}
                </span>
              </div>

              {/* Status Badge */}
              <div className="border-2 border-[#9FE870] px-4 py-3 mb-5">
                <span className="text-[9px] uppercase tracking-[0.15em] opacity-50 block">
                  Current Status
                </span>
                <div className="text-xl font-black uppercase tracking-tight mt-1">
                  {creditState.status}
                </div>
              </div>

              {/* Key-Value Rows */}
              <div className="flex-1 space-y-1.5 text-[11px]">
                {(
                  [
                    ["OWNER", creditState.owner],
                    ["PRODUCER", creditState.producer],
                    ["PROJECT", creditState.project],
                    ["CREDITS", creditState.credits],
                    ["CERTIFIER", creditState.certifier],
                    ["TOKEN ID", creditState.tokenId],
                    ["TX HASH", creditState.txHash],
                    ["IPFS", creditState.ipfsCid],
                    ["PRICE", creditState.price],
                    ["BUYER", creditState.buyer],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-[#9FE870]/15 pb-1.5"
                  >
                    <span className="opacity-40 uppercase tracking-widest text-[10px]">
                      {label}
                    </span>
                    <span
                      className={
                        value !== "—"
                          ? "text-[#9FE870] font-bold"
                          : "opacity-15"
                      }
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Phase State-Machine Bar */}
              <div className="mt-4 pt-3 border-t border-[#9FE870]/20">
                <span className="text-[9px] uppercase tracking-[0.15em] opacity-40 block mb-2">
                  Lifecycle Progress
                </span>
                <div className="flex flex-wrap gap-1">
                  {CREDIT_PHASES.map((phase, i) => {
                    const isPhaseActive = i === activeStep;
                    const isPhaseComplete =
                      i < activeStep ||
                      (liveStatus === "done" && i <= activeStep);
                    return (
                      <span
                        key={phase}
                        className={[
                          "text-[9px] font-black px-2 py-1 border transition-all duration-300",
                          isPhaseActive
                            ? "bg-[#9FE870] text-[#1A3614] border-[#9FE870] shadow-[2px_2px_0px_#9FE870]"
                            : isPhaseComplete
                              ? "bg-[#9FE870]/20 text-[#9FE870] border-[#9FE870]/50"
                              : "border-[#9FE870]/15 text-[#9FE870]/20",
                        ].join(" ")}
                      >
                        {phase}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ── STATIC: Image ── */
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.imgUrl}
                alt={current.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-80"
              />
            </>
          )}
        </div>

        {/* Right column — content + terminal */}
        <div className="w-1/2 flex flex-col">
          {/* Top — business story */}
          <div className="flex-1 bg-[#F2F5F1] p-8 flex flex-col justify-center overflow-y-auto">
            <span className="text-xs font-black uppercase tracking-widest opacity-50 mb-2">
              {current.phase}
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">
              {current.title}
            </h2>
            <p className="text-sm leading-relaxed mb-6 text-[#1A3614]">
              {current.desc}
            </p>
            <span className="self-start bg-[#1A3614] text-[#9FE870] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_#9FE870]">
              {current.impact}
            </span>
          </div>

          {/* Bottom — System Logs terminal */}
          <div className="border-t-2 border-[#1A3614] flex flex-col">
            <div className="bg-[#1A3614] text-[#9FE870] text-xs font-bold px-4 py-2 uppercase tracking-widest flex justify-between">
              <span>
                {isLive && liveLogs[activeStep]
                  ? "Live Response"
                  : "System Logs"}
              </span>
              <span>
                {isLive && liveLogs[activeStep]
                  ? "Server: localhost:5000"
                  : "Server: Static"}
              </span>
            </div>
            <div className="bg-[#050505] text-[#9FE870] p-5 font-mono text-xs overflow-auto whitespace-pre-wrap leading-relaxed max-h-[240px]">
              {liveStatus === "running" && !liveLogs[activeStep] ? (
                <span className="animate-pulse">
                  {isPaused
                    ? "Paused — click RESUME to continue..."
                    : "Calling backend API..."}
                </span>
              ) : (
                terminalContent
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="mt-6 border-2 border-[#1A3614] bg-[#9FE870] h-6">
        <div
          className="h-full bg-[#1A3614] transition-all duration-300"
          style={{
            width: `${((activeStep + 1) / lifecycleStages.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
