import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe('Token', function () {
  const zero_address = ethers.constants.AddressZero;
  let owner: SignerWithAddress;
  let account1: SignerWithAddress;
  let token: any;

  before(async function () {
    const ERC20 = await ethers.getContractFactory("Token");
    [owner, account1] = await ethers.getSigners();
    token = await ERC20.deploy();
  });
  describe('Mint', () => {
    it('to the address successfully', async function () {
      const balance_account0 = await token.balanceOf(owner.address);
      const total_supply = await token.totalSupply();
      let tx = token.mint(owner.address, 100);
      await expect(tx).to.emit(token, "Transfer").withArgs(zero_address, owner.address, 100);
      const new_balance_account0 = await token.balanceOf(owner.address);
      const new_total_supply = await token.totalSupply();
      expect(new_balance_account0).to.equal(balance_account0.add(100));
      expect(new_total_supply).to.equal(total_supply.add(100));
    });
    it('revert transaction, due to zero address', async function () {
      await expect(token.mint(zero_address, 100)).to.be.rejectedWith("ERC20: mint to the zero address");
    });
    it('revert transaction, due to done not by the owner', async function () {
      await expect(token.connect(account1).mint(account1.address, 100)).to.be.rejected;
    });
  });
});
