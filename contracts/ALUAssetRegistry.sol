// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ALUAssetRegistry is ERC721 {
    struct AssetMetadata {
        string assetName;
        string fileType;
        bytes32 contentHash;
        address registrar;
        uint256 timestamp;
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 => AssetMetadata) private _assets;
    mapping(bytes32 => bool) public registeredHashes;

    event AssetRegistered(
        uint256 indexed tokenId,
        string assetName,
        string fileType,
        bytes32 contentHash,
        address indexed registrar,
        uint256 timestamp
    );

    constructor() ERC721("ALU Registered Asset", "ALURA") {}

    function registerAsset(
        string memory assetName,
        string memory fileType,
        bytes32 contentHash
    ) external returns (uint256) {
        require(bytes(assetName).length > 0, "Asset name required");
        require(bytes(fileType).length > 0, "File type required");
        require(contentHash != bytes32(0), "Hash required");
        require(!registeredHashes[contentHash], "Asset hash already registered");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        _assets[tokenId] = AssetMetadata({
            assetName: assetName,
            fileType: fileType,
            contentHash: contentHash,
            registrar: msg.sender,
            timestamp: block.timestamp
        });

        registeredHashes[contentHash] = true;

        emit AssetRegistered(
            tokenId,
            assetName,
            fileType,
            contentHash,
            msg.sender,
            block.timestamp
        );

        return tokenId;
    }

    function verifyLogoIntegrity(
        uint256 tokenId,
        bytes32 submittedHash
    ) external view returns (bool, string memory) {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");

        if (_assets[tokenId].contentHash == submittedHash) {
            return (true, "Logo is authentic.");
        }

        return (false, "Warning: logo does not match.");
    }

    function getAsset(
        uint256 tokenId
    ) external view returns (AssetMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Asset does not exist");
        return _assets[tokenId];
    }
}