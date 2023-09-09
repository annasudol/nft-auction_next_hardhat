import { ethers } from "hardhat";

async function main() {
    const CONTRACT = await ethers.getContractFactory("MyNFT");
    const contract = await CONTRACT.deploy();
    await contract.deployed();
    console.log("Erc721 deployed to:", contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
