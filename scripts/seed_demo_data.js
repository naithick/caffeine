const API = "http://localhost:5000/api";

async function main() {
  console.log("=== Seeding extra demo data via API ===");

  console.log("[1/6] Creating additional proposals...");
  const p1 = await fetch(`${API}/proposals`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
    producer_id: "aaaa0001-0001-0001-0001-000000000001", title: "Borneo Peatland Conservation", description: "Conservation of 500 hectares of tropical peatland in Central Kalimantan. Methodology VM0004 applied for avoided emissions from peat decomposition.", credit_quantity: 300, sensor_data: {"device_id": "IOT-PEAT-B4", "co2_sequestered_tons": 300, "temperature_c": 30, "humidity_pct": 88, "ndvi_score": 0.78, "recorded_at": "2026-03-09T10:00:00Z"}
  })}).then(r => r.json());
  console.log("  Proposal:", p1.proposal?.id || "ERR");

  const p2 = await fetch(`${API}/proposals`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
    producer_id: "aaaa0001-0001-0001-0001-000000000001", title: "Himalayan Agroforestry Initiative", description: "Planting native fruit and timber trees across 80 hectares of degraded agricultural land in Uttarakhand. Baseline methodology AR-AMS0007.", credit_quantity: 120, sensor_data: {"device_id": "IOT-AGRO-H5", "co2_sequestered_tons": 120, "temperature_c": 18, "humidity_pct": 65, "ndvi_score": 0.67, "recorded_at": "2026-03-10T06:00:00Z"}
  })}).then(r => r.json());
  console.log("  Proposal:", p2.proposal?.id || "ERR");

  const p3 = await fetch(`${API}/proposals`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
    producer_id: "aaaa0001-0001-0001-0001-000000000001", title: "Tamil Nadu Wind Farm Upgrade", description: "Repowering 15 wind turbines in the Muppandal wind farm. Old 250kW units replaced with 2MW turbines. Methodology AMS-I.D applied.", credit_quantity: 450, sensor_data: {"device_id": "IOT-WIND-TN6", "co2_sequestered_tons": 450, "temperature_c": 33, "humidity_pct": 55, "ndvi_score": 0.52, "recorded_at": "2026-03-08T16:00:00Z"}
  })}).then(r => r.json());
  console.log("  Proposal:", p3.proposal?.id || "ERR");

  console.log("[2/6] Auto-verifying proposals via MRV Oracle...");
  const proposalsRes = await fetch(`${API}/proposals`).then(r => r.json());
  const submitted = (proposalsRes.proposals || []).filter(p => p.status === 'submitted');
  let verifiedCount = 0;
  for (const p of submitted) {
    const res = await fetch(`${API}/verification/auto`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({proposal_id: p.id})}).then(r => r.json());
    if (res.credit) {
      verifiedCount++;
      console.log("  ✅ Verified:", p.id);
    } else {
      console.log("  ⏭ Skipped (NDVI < 0.6):", p.id);
    }
  }
  console.log("  Verified", verifiedCount, "proposals");

  console.log("[3/6] Listing verified credits on marketplace...");
  
  console.log("[4/6] Creating notifications...");
  await fetch(`${API}/notifications`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: "aaaa0001-0001-0001-0001-000000000001", message: "Your Borneo Peatland Conservation proposal has been auto-verified by MRV Oracle.", type: "success" }) });
  await fetch(`${API}/notifications`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: "aaaa0002-0002-0002-0002-000000000002", message: "New carbon credits are available on the marketplace. Browse 3 new listings.", type: "info" }) });
  await fetch(`${API}/notifications`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: "aaaa0003-0003-0003-0003-000000000003", message: "2 proposals auto-verified by MRV Oracle. Review their sensor data.", type: "info" }) });
  await fetch(`${API}/notifications`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ user_id: "aaaa0004-0004-0004-0004-000000000004", message: "Carbon credit prices have dropped 5% this week. Good time to invest.", type: "info" }) });
  console.log("  4 notifications created");

  console.log("[5/6] Logging credit history events...");
  await fetch(`${API}/history`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ credit_id: "pppp0001-0001-0001-0001-000000000001", action: "minted", actor_id: "aaaa0001-0001-0001-0001-000000000001", tx_hash: "0xdemo1234567890abcdef" }) });
  await fetch(`${API}/history`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ credit_id: "pppp0001-0001-0001-0001-000000000001", action: "listed", actor_id: "aaaa0001-0001-0001-0001-000000000001", price_eth: "2.5" }) });
  console.log("  2 history entries created");

  console.log("\n[6/6] Done! Extra demo data seeded.");
  console.log("\nDemo accounts:");
  console.log("  Seller : admin@greenforest.io  → seller dashboard");
  console.log("  Buyer  : trade@ecotrade.com    → buyer dashboard");
  console.log("  Verifier: audit@verraaudit.org → verifier dashboard");
}

main().catch(console.error);
