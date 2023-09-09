import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTAuction", function () {
    const ONE_DAY_IN_SECS = 24 * 60 * 60;

    let erc20: any;
    let erc721: any;
    let auction: any;
    let acc0: SignerWithAddress;
    let acc1: SignerWithAddress;
    let acc2: SignerWithAddress;
    const nftId_1 = 1;
    const nftId_3 = 3;

    before(async () => {
        [acc0, acc1, acc2] = await ethers.getSigners();
        const MyErc20 = await ethers.getContractFactory("Token");
        erc20 = await MyErc20.deploy();
        const MyNFT = await ethers.getContractFactory("MyNFT");
        erc721 = await MyNFT.deploy();

        const NFTAuction = await ethers.getContractFactory("NFTAuction");
        auction = await NFTAuction.deploy(erc20.address);
        await erc20.mint(acc0.address, 100);
    })

    describe('listNFTOnAuction', () => {
        const min_bid = 2;
        before(async function () {
            await erc721.mintNFT(acc0.address, nftId_1);
            await erc721.connect(acc1).mintNFT(acc1.address, nftId_3)
        });
        it('emits ERC721Received ang change the owner to contract address', async () => {
            let nftOwner = await erc721.ownerOf(nftId_1);
            expect(nftOwner).to.equal(acc0.address)
            await erc721.approve(auction.address, nftId_1)
            await erc20.increaseAllowance(auction.address, min_bid);
            const tx = await auction.listNFTOnAuction(nftId_1, min_bid, 1, erc721.address);
            await expect(tx).to.emit(auction, "ERC721Received").withArgs(auction.address, acc0.address, nftId_1, '0x');
            nftOwner = await erc721.ownerOf(nftId_1);
            expect(nftOwner).to.equal(auction.address)
        });
        it('reverts transaction', (async () => {
            await erc20.transfer(acc1.address, 1);
            await erc20.connect(acc1).increaseAllowance(auction.address, min_bid);
            await erc721.connect(acc1).approve(auction.address, nftId_3)
            await expect(auction.listNFTOnAuction(nftId_3, min_bid, 1, erc721.address)).to.be.rejectedWith("only owner");
            await expect(auction.connect(acc1).listNFTOnAuction(nftId_3, min_bid, 1, erc721.address)).to.be.rejectedWith("not enough ERC20 funds");
        }));
    });

    describe('place Bid', () => {
        const bid_1 = 5;
        const bid_2 = 7;
        const nftId_4 = 4;
        before(async function () {
            await erc721.mintNFT(acc0.address, nftId_4);
            await erc721.approve(auction.address, nftId_4);
            await erc20.increaseAllowance(auction.address, 12);
            await auction.listNFTOnAuction(nftId_4, 1, 1, erc721.address);
        });
        it('reverts transaction', async () => {
            await expect(auction.placeBid(nftId_1, 1)).to.be.rejectedWith("min bid is higher");
            await expect(auction.connect(acc2).placeBid(nftId_1, 10)).to.be.rejected;
        });
        it('changes state after accepting transaction', async () => {
            let tx = await auction.placeBid(nftId_4, bid_1);
            expect(tx).to.emit(auction, "Bid").withArgs(acc0.address, nftId_4, bid_1);
            const { highestBidder, highestBid } = await auction.NFTs(nftId_4);
            expect(highestBidder).to.equal(acc0.address);
            expect(highestBid).to.be.equal(bid_1);
            await erc20.connect(acc1).increaseAllowance(auction.address, 10);
            await erc721.connect(acc1).approve(auction.address, nftId_3)
            await expect(auction.connect(acc1).placeBid(nftId_4, 10)).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
            await expect(auction.connect(acc1).placeBid(nftId_4, 4)).to.be.rejectedWith("last bid is higher");
            await erc20.increaseAllowance(auction.address, bid_2);
            tx = await auction.placeBid(nftId_4, bid_2);
            expect(tx).to.emit(auction, "Bid").withArgs(acc0.address, nftId_4, bid_2);
        })
    });

    describe('finish auction', () => {
        const nftId_5 = 5;
        const nftId_6 = 6;
        before(async function () {
            await erc721.mintNFT(acc0.address, nftId_5);
            await erc721.approve(auction.address, nftId_5);
            await erc20.increaseAllowance(auction.address, 11);
            await auction.listNFTOnAuction(nftId_5, 1, 1, erc721.address);
        });

        it('reverts transaction', async () => {
            await expect(auction.finishAuction(nftId_5)).to.be.rejectedWith("auction not ended")
        });
        it('finish transaction without bids', async () => {
            const endAt = (await time.latest()) + ONE_DAY_IN_SECS;
            await time.increaseTo(endAt);
            const tx = await auction.finishAuction(nftId_5);
            expect(tx).to.emit(auction, "ReturnNFT").withArgs(nftId_5);
        });
        it('finish transaction with bids', async () => {
            await erc721.mintNFT(acc0.address, nftId_6);
            await erc721.approve(auction.address, nftId_6);
            await auction.listNFTOnAuction(nftId_6, 1, 1, erc721.address);
            await erc20.transfer(acc1.address, 5);
            await erc20.connect(acc1).increaseAllowance(auction.address, 5);
            await auction.connect(acc1).placeBid(nftId_6, 5);
            const endAt = (await time.latest()) + ONE_DAY_IN_SECS;
            await time.increaseTo(endAt);
            await expect(auction.placeBid(nftId_6, 5)).to.be.rejectedWith("auction ended")
            const tx = await auction.finishAuction(nftId_6);
            expect(tx).to.emit(auction, "FinishAuction").withArgs(acc1.address, nftId_6, 5);
            const ownerNFT = await erc721.ownerOf(nftId_6);
            expect(ownerNFT).to.be.equal(acc1.address)
        });
    });
});
