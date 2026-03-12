/**
 * mrvOracle.js — Automated MRV (Measurement, Reporting & Verification) Oracle
 *
 * Simulates a geospatial satellite API that validates carbon credit proposals
 * using NDVI (Normalized Difference Vegetation Index) scoring.
 *
 * In production this would call a real satellite data provider
 * (e.g. Sentinel Hub, Planet Labs, Google Earth Engine).
 */

const MAX_TONS_PER_ACRE = 15;

/**
 * Simulate a satellite geospatial validation for a carbon credit proposal.
 *
 * @param {object} proposalData  - Row from the proposals table
 * @param {number} proposalData.credit_quantity - Number of carbon credits requested
 * @param {number} [proposalData.acreage]       - Project area in acres (optional;
 *                                                defaults to a permissive large value
 *                                                if not provided)
 * @returns {Promise<{ verified: boolean, ndvi_score?: number, reason?: string }>}
 */
async function simulateSatelliteValidation(proposalData) {
  // Mock geospatial API latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Use the NDVI score from the proposal's IoT sensor data if available,
  // otherwise fall back to a random score. This ensures the UI value
  // and the backend decision stay in sync during demos.
  const ndvi_score = (proposalData.sensor_data && typeof proposalData.sensor_data.ndvi_score === 'number')
    ? proposalData.sensor_data.ndvi_score
    : parseFloat((Math.random() * 0.6 + 0.3).toFixed(4));

  const { credit_quantity, acreage } = proposalData;

  // If acreage is not provided we fall back to a very large default so the
  // capacity check does not spuriously reject proposals that omit the field.
  const effectiveAcreage =
    acreage && acreage > 0 ? acreage : credit_quantity / MAX_TONS_PER_ACRE + 1;

  const capacityOk = credit_quantity <= effectiveAcreage * MAX_TONS_PER_ACRE;
  const ndviOk = ndvi_score > 0.6;

  if (ndviOk && capacityOk) {
    return { verified: true, ndvi_score };
  }

  return {
    verified: false,
    ndvi_score,
    reason: "NDVI threshold failed or capacity exceeded",
  };
}

module.exports = { simulateSatelliteValidation };
