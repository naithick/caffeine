// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title MarketplaceEscrow
/// @notice Escrow contract for buying and selling CarbonCreditNFTs.
contract MarketplaceEscrow {
    IERC721 public immutable nftContract;

    struct Listing {
        address seller;
        uint256 price;
    }

    /// @notice tokenId => Listing
    mapping(uint256 => Listing) public listings;

    /// @notice Emitted when a listed credit is purchased.
    event CreditSold(uint256 tokenId, address buyer, uint256 price);

    /// @param _nftContract Address of the deployed CarbonCreditNFT contract.
    constructor(address _nftContract) {
        nftContract = IERC721(_nftContract);
    }

    /// @notice List a carbon credit NFT for sale.
    /// @dev    The seller must have called `approve(address(this), tokenId)` on the
    ///         CarbonCreditNFT contract before calling this function.
    /// @param tokenId The token to list.
    /// @param price   The asking price in wei.
    function listCredit(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(
            nftContract.ownerOf(tokenId) == msg.sender,
            "Caller is not the token owner"
        );
        require(
            nftContract.getApproved(tokenId) == address(this),
            "Escrow contract not approved for this token"
        );

        listings[tokenId] = Listing({ seller: msg.sender, price: price });
    }

    /// @notice Buy a listed carbon credit NFT.
    /// @dev    Transfers the NFT to msg.sender and sends msg.value to the seller.
    /// @param tokenId The token to purchase.
    function buyCredit(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "Token is not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        // Clear the listing before external calls (checks-effects-interactions).
        delete listings[tokenId];

        // Transfer NFT from seller to buyer.
        nftContract.transferFrom(listing.seller, msg.sender, tokenId);

        // Send payment to seller.
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Payment to seller failed");

        emit CreditSold(tokenId, msg.sender, listing.price);
    }
}
