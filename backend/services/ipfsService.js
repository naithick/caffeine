/**
 * ipfsService.js
 *
 * Service for interacting with Pinata to pin metadata to IPFS.
 */

const axios = require("axios");

/**
 * Pins JSON metadata to IPFS via Pinata.
 *
 * @param {object} metadataJSON - The JSON metadata object to pin.
 * @returns {Promise<string>} - The IPFS hash (CID) of the pinned content.
 */
async function pinMetadataToIPFS(metadataJSON) {
    try {
        const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

        // The Pinata API expects the metadata inside a 'pinataContent' property
        const body = {
            pinataContent: metadataJSON
        };

        const config = {
            headers: {
                "Content-Type": "application/json",
                "pinata_api_key": process.env.PINATA_API_KEY,
                "pinata_secret_api_key": process.env.PINATA_SECRET_KEY
            }
        };

        const response = await axios.post(url, body, config);

        return response.data.IpfsHash;
    } catch (error) {
        console.error("Error pinning metadata to IPFS:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    pinMetadataToIPFS,
};
