// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CarbonCreditNFT
/// @notice ERC-721 token representing verified carbon credits.
/// @dev Only the contract owner can mint new credits.
contract CarbonCreditNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    /// @notice Registry of approved certifier wallets
    mapping(address => bool) public approvedCertifiers;

    /// @param initialOwner The address that will own the contract and have minting rights.
    constructor(address initialOwner)
        ERC721("CarbonCreditNFT", "CCNFT")
        Ownable(initialOwner)
    {}

    /// @notice Emitted when a carbon credit is permanently retired (burned).
    event CreditRetired(uint256 tokenId, address owner);

    /// @notice Retire (burn) a carbon credit, permanently removing it from circulation.
    /// @dev    Only the current token owner may call this.
    /// @param  tokenId The token to retire.
    function retireCredit(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the token owner");
        address tokenOwner = msg.sender;
        _burn(tokenId);
        emit CreditRetired(tokenId, tokenOwner);
    }

    /// @notice Mint a new carbon credit NFT.
    /// @param to      The wallet address that will receive the NFT.
    /// @param uri     The metadata URI for this carbon credit.
    /// @return tokenId The ID of the newly minted token.
    function mintCredit(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    /// @notice Add a new approved certifier.
    /// @dev Only the contract owner can call this.
    /// @param certifier The address to accredit.
    function addCertifier(address certifier) public onlyOwner {
        approvedCertifiers[certifier] = true;
    }

    /// @notice Revoke a fraudulent credit.
    /// @dev Only the contract owner can call this.
    /// @param tokenId The ID of the token to revoke (burn).
    function revokeCredit(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    // ── Overrides required by Solidity for multiple inheritance ──

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
