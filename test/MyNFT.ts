import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe('MyNFT', function () {
    const zero_address = ethers.constants.AddressZero;
    let acc0: SignerWithAddress;
    let acc1: SignerWithAddress;
    let token: any;

    before(async function () {
        const MyNFT = await ethers.getContractFactory("MyNFT");
        [acc0, acc1] = await ethers.getSigners();
        token = await MyNFT.deploy();
    });
    describe('safeMint', () => {
        const tokenId = 1;
        it('to the address successfully', async function () {
            const balance_account0 = await token.balanceOf(acc0.address);
            let tx = token.mintNFT(acc0.address, tokenId);
            await expect(tx).to.emit(token, "Transfer").withArgs(zero_address, acc0.address, tokenId);
            const new_balance_account0 = await token.balanceOf(acc0.address);
            expect(new_balance_account0).to.equal(balance_account0.add(1));
            const token_owner = await token.ownerOf(tokenId);
            expect(token_owner).to.equal(acc0.address);
        });
    });
});
