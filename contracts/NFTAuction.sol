// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface Itoken {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

}
interface IMyNFT {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external returns (address);
}

contract NFTAuction is IERC721Receiver {
    IMyNFT public myNFT;
    Itoken public token;
    address public contractOwner;

    struct NFTAsset {
        uint256 toknenID;
        uint256 minBid;
        uint256 highestBid;
        address highestBidder;
        uint256 startAt;
        uint256 endAt;
        address owner;
    }
    mapping(uint256=> NFTAsset) public NFTs;

    constructor(address _token_address) {
        contractOwner = msg.sender;
        token = Itoken(_token_address);
        myNFT = IMyNFT(_token_address);
    }

    event ERC721Received(address operator, address from, uint tokenId, bytes data);
    event Bid(address bidder, uint256 tokenId, uint256 bid);
    event FinishAuction(address winner, uint256 tokenId, uint256 bid);
    event ReturnNFT(uint256 tokenId);

    modifier checkBalance(uint256 bid) {
        uint256 balance = token.balanceOf(msg.sender);
        require(balance >= bid, 'not enough ERC20 funds');
        _;
    }
    /**
     * ERC721TokenReceiver interface function. Hook that will be triggered on safeTransferFrom as per EIP-721.
     * It should execute a deposit for `_from` address.
     * After deposit this token can be either returned back to the owner, or placed on auction.
     * It should emit an event that will let the user know that the deposit is successful.
     * It is mandatory to call ERC721 contract back to check if a token is received by auction (require ownerOf(nftId) to be equal address(this))
     */
    // function onERC721Received(address,
    //     address,
    //     uint256,
    //     bytes calldata) external pure returns (bytes4) {
    //     emit ERC721Received(from, _tokenId);
    //     return IERC721Receiver.onERC721Received.selector;
    // }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public override returns (bytes4) {
        emit ERC721Received(operator, from, tokenId, data);
        return this.onERC721Received.selector;
    }
    /*
    list on auction NFT that msg.sender has deposited with safeTransferFrom. 
    Users willing to list their NFT are free to choose any ERC20 token for bids. 
    Also, they have to input the auction start UTC timestamp, auction end UTC timestamp and minimum bid amount. 
    During the auction there should be no way for NFT to leave the contract - it should be locked on contract. 
    One NFT can participate in only one auction.
    */
    function listNFTOnAuction(uint256 _tokenId, uint256 _minBid, uint256 numberOfDays) checkBalance(_minBid) public {
        address nftOwner = myNFT.ownerOf(_tokenId);
        require(nftOwner == msg.sender, "only owner");

        NFTs[_tokenId] = NFTAsset(_tokenId, _minBid, 0, address(0), block.timestamp, block.timestamp + (numberOfDays * 1 days), msg.sender);
        token.transferFrom(msg.sender, address(this), _minBid);
        myNFT.safeTransferFrom(nftOwner, address(this), _tokenId);
    }



    function placeBid(uint256 _tokenId, uint256 bid) public {
        require(NFTs[_tokenId].endAt > block.timestamp, "auction ended");
        require(NFTs[_tokenId].minBid < bid, "min bid is higher");
        require(NFTs[_tokenId].highestBid < bid, "last bid is higher");

        //If there were previous bids
        if(NFTs[_tokenId].highestBidder != address(0)){
            //transfer money to the previous bidder
            token.transferFrom(msg.sender, NFTs[_tokenId].highestBidder, bid);
        } else {
        //no b bids, transfer money to the NFT owner
            token.transferFrom(msg.sender, NFTs[_tokenId].owner, bid);
        }
        NFTs[_tokenId].highestBidder = msg.sender;
        NFTs[_tokenId].highestBid = bid;
        emit Bid(msg.sender, _tokenId, bid);
    }

    /**
     * can be called by anyone on blockchain after auction end UTC timestamp is reached.
     * Function should summarize auction results, transfer winning amount of ERC20 tokens to the auction issuer and unlock NFT for withdrawal
     * or placing on auction again only for the auction winner.
     * Note, that if the auction is finished without any single bid,
     * it should not make any ERC20 token transfer and let the auction issuer withdraw the token or start auction again.
     */
    function finishAuction(uint256 _tokenId) public {
         require(NFTs[_tokenId].endAt < block.timestamp, "auction not ended");
         if(NFTs[_tokenId].highestBid > 0) {
            emit FinishAuction(NFTs[_tokenId].highestBidder, _tokenId, NFTs[_tokenId].highestBid);
            myNFT.safeTransferFrom(address(this), NFTs[_tokenId].highestBidder, _tokenId);
            delete NFTs[_tokenId];
         } else {
            //no bids, nft back to the owner
            emit ReturnNFT(_tokenId);
            _withdrawNft(_tokenId);
         }
    }


    function _withdrawNft(uint256 _tokenId) internal {
        //money and NFT is going back to the NFT creator
        token.transfer(NFTs[_tokenId].owner, NFTs[_tokenId].minBid);
        myNFT.safeTransferFrom(address(this), NFTs[_tokenId].owner, _tokenId);
        delete NFTs[_tokenId];
    }
}
