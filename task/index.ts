import { task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();
const ERC20_CONTRACT = process.env.ERC20 || '';
const ERC721: string = process.env.ERC721 || '';
const NFT_AUCTION_CONTRACT_ADDRESS = process.env.NFT_AUCTION_CONTRACT_ADDRESS || '';
task("mint", "Mint new NFT")
    .addParam("to", "ownerAddress")
    .addParam("id", "tokenId")
    .setAction(async (taskArgs: { to: any; id: any }, hre) => {
        const myErc70 = await hre.ethers.getContractAt("MyNFT", ERC721);
        const [account] = await hre.ethers.getSigners();
        let tx_1 = await myErc70.mintNFT(taskArgs.to, taskArgs.id);
        console.log(`MIntend NFT ${taskArgs.id} ETH, tx: ${tx_1.hash}, by ${account.address}`);
    });

task("listNFTOnAuction", "listNFT")
    .addParam("min", "minPrice")
    .addParam("id", "tokenId")
    .addParam("days", "numberOfDays")
    .setAction(async (taskArgs: { minPrice: any; tokenId: any, numberOfDays: any, }, hre) => {
        const NFTAuction = await hre.ethers.getContractAt("NFTAuction", NFT_AUCTION_CONTRACT_ADDRESS);
        const erc20 = await hre.ethers.getContractAt("Token", ERC20_CONTRACT);
        erc20.increaseAllowance(NFT_AUCTION_CONTRACT_ADDRESS, taskArgs.minPrice)
        const [account] = await hre.ethers.getSigners();
        let tx_1 = await NFTAuction.listNFTOnAuction(taskArgs.tokenId, taskArgs.minPrice, taskArgs.numberOfDays);
        console.log(`listed NFT ${taskArgs.tokenId} ETH, tx: ${tx_1.hash}, by ${account.address}`);
    });
