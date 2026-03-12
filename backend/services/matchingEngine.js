const supabase = require("../config/supabaseClient");

async function runMatchingEngine() {
  try {
    // Fetch all open buy orders, highest bid first, then oldest
    const { data: buyOrders, error: buyError } = await supabase
      .from("buy_orders")
      .select("*")
      .eq("status", "open")
      .order("bid_price_eth", { ascending: false })
      .order("placed_at", { ascending: true });

    if (buyError) throw buyError;

    // Fetch all open sell orders, lowest ask first, then oldest
    const { data: sellOrders, error: sellError } = await supabase
      .from("sell_orders")
      .select("*")
      .eq("status", "open")
      .order("asking_price_eth", { ascending: true })
      .order("listed_at", { ascending: true });

    if (sellError) throw sellError;

    // Match strictly based on Price-Time priority per credit asset
    for (const buy of buyOrders) {
      if (buy.status !== "open" && buy.status !== "partially_filled") continue;

      let remainingBuyQty = buy.quantity;

      for (const sell of sellOrders) {
        // Ignore if not for the exact same specific asset
        if (sell.credit_id !== buy.credit_id) continue;
        if (sell.status !== "open" && sell.status !== "partially_filled")
          continue;

        const bidPrice = BigInt(buy.bid_price_eth);
        const askPrice = BigInt(sell.asking_price_eth);

        // Exact or better price match
        if (bidPrice >= askPrice) {
          const matchQty = Math.min(remainingBuyQty, sell.quantity);

          // Maker pricing logic (oldest gets to dictate execution price)
          const buyTime = new Date(buy.placed_at).getTime();
          const sellTime = new Date(sell.listed_at).getTime();
          const executionPrice =
            sellTime < buyTime ? sell.asking_price_eth : buy.bid_price_eth;

          // 1. Create record in trades table
          await supabase.from("trades").insert({
            sell_order_id: sell.id,
            buy_order_id: buy.id,
            credit_id: buy.credit_id,
            execution_price_eth: executionPrice,
            quantity: matchQty,
            status: "matched",
          });

          // 2. Update sell_orders status
          sell.quantity -= matchQty;
          sell.status = sell.quantity === 0 ? "filled" : "partially_filled";
          await supabase
            .from("sell_orders")
            .update({
              quantity: sell.quantity,
              status: sell.status,
            })
            .eq("id", sell.id);

          // 3. Update buy_orders status
          remainingBuyQty -= matchQty;
          buy.status = remainingBuyQty === 0 ? "filled" : "partially_filled";
          await supabase
            .from("buy_orders")
            .update({
              quantity: remainingBuyQty,
              status: buy.status,
            })
            .eq("id", buy.id);

          if (remainingBuyQty === 0) break;
        }
      }
    }
  } catch (error) {
    console.error("Matching engine error:", error);
  }
}

module.exports = { runMatchingEngine };
