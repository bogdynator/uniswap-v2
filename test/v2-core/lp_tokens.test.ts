import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";

import {
  ExposedUniswapV2ERC20,
  ExposedUniswapV2ERC20__factory,
  UniswapV2ERC20,
  UniswapV2ERC20__factory,
} from "../../typechain";

xdescribe("LP tokens tests", async () => {
  let UniswapV2ERC20: UniswapV2ERC20;
  let ExposedUniswapV2ERC20: ExposedUniswapV2ERC20;
  let UniswapV2ERC20Factory: UniswapV2ERC20__factory;
  let ExposedUniswapV2ERC20Factory: ExposedUniswapV2ERC20__factory;

  let user: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  before(async () => {
    [user, bob, alice] = await ethers.getSigners();
    UniswapV2ERC20Factory = (await ethers.getContractFactory("UniswapV2ERC20", user)) as UniswapV2ERC20__factory;
    ExposedUniswapV2ERC20Factory = (await ethers.getContractFactory(
      "ExposedUniswapV2ERC20",
      user,
    )) as ExposedUniswapV2ERC20__factory;
  });

  beforeEach(async () => {
    UniswapV2ERC20 = await UniswapV2ERC20Factory.deploy();
    ExposedUniswapV2ERC20 = await ExposedUniswapV2ERC20Factory.deploy();
  });

  it("Deploy correctly", async () => {
    expect(await UniswapV2ERC20.name()).to.be.equal("Uniswap V2");
  });

  it("mint", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("1"));

    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("1"));
  });

  it("burn", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("1"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("1"));

    await expect(ExposedUniswapV2ERC20.burn(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(bob.address, ethers.constants.AddressZero, ethers.utils.parseEther("1"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("0"));
  });

  it("approve", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("1"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("1"));

    await expect(UniswapV2ERC20.connect(bob).approve(user.address, ethers.utils.parseEther("1")))
      .to.emit(UniswapV2ERC20, "Approval")
      .withArgs(bob.address, user.address, ethers.utils.parseEther("1"));
  });

  it("transfer from with approve", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("2")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("2"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.equal(ethers.utils.parseEther("2"));

    await expect(ExposedUniswapV2ERC20.connect(bob).approve(user.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Approval")
      .withArgs(bob.address, user.address, ethers.utils.parseEther("1"));

    await expect(ExposedUniswapV2ERC20.transferFrom(bob.address, user.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(bob.address, user.address, ethers.utils.parseEther("1"));
  });

  it("transfer from without approve", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("1"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.be.equal(ethers.utils.parseEther("1"));

    await expect(
      ExposedUniswapV2ERC20.transferFrom(bob.address, user.address, ethers.utils.parseEther("1")),
    ).to.be.revertedWith("VM Exception while processing transaction: reverted with panic code 0x11");
  });

  it("transfer", async () => {
    await expect(ExposedUniswapV2ERC20.mint(bob.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(ethers.constants.AddressZero, bob.address, ethers.utils.parseEther("1"));
    expect(await ExposedUniswapV2ERC20.balanceOf(bob.address)).to.be.equal(ethers.utils.parseEther("1"));

    await expect(ExposedUniswapV2ERC20.connect(bob).transfer(user.address, ethers.utils.parseEther("1")))
      .to.emit(ExposedUniswapV2ERC20, "Transfer")
      .withArgs(bob.address, user.address, ethers.utils.parseEther("1"));
  });
});
