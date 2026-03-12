/**
 * registryBridge.js
 *
 * Service for interacting with external carbon registries to prevent double-counting.
 */

/**
 * Checks external mock registries (like Verra) for duplicate sensor data.
 *
 * @param {string} sensorDataHash - The hash of the sensor data to check.
 * @returns {Promise<boolean>} - Returns true if the data DOES NOT exist (is unique),
 *                               and false if it DOES exist (is a duplicate).
 */
async function checkExternalRegistries(sensorDataHash) {
    try {
        const url = `https://mock-api.verra.org/check?hash=${encodeURIComponent(sensorDataHash)}`;

        // Use native Node.js fetch API
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`External registry responded with status: ${response.status}`);
        }

        const data = await response.json();

        // If the data exists externally, return false (indicating it's a duplicate)
        if (data.exists === true) {
            return false;
        }

        // If the data does not exist, return true (indicating it's unique)
        return true;
    } catch (error) {
        console.error("Error communicating with external registry:", error.message);
        // On failure or if exists: false, return true to allow the process to continue
        return true;
    }
}

module.exports = {
    checkExternalRegistries,
};
