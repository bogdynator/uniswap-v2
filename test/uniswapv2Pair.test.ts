import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractReceipt } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import { ByteLengthQueuingStrategy } from "stream/web";

import {
  ExposedUniswapV2ERC20,
  ExposedUniswapV2ERC20__factory,
  Token,
  Token__factory,
  UniswapV2Factory,
  UniswapV2Factory__factory,
  UniswapV2LibraryMock,
  UniswapV2LibraryMock__factory,
  UniswapV2Pair,
  UniswapV2Pair__factory,
} from "../typechain";

describe("Pair tests", async () => {
  let ExposedUniswapV2ERC20: ExposedUniswapV2ERC20;
  let UniswapV2Pair: UniswapV2Pair;
  let UniswapV2Factory: UniswapV2Factory;
  let UniswapV2LibraryMock: UniswapV2LibraryMock;

  let Token1: Token;
  let Token2: Token;

  let ExposedUniswapV2ERC20Factory: ExposedUniswapV2ERC20__factory;
  let UniswapV2PairFactory: UniswapV2Pair__factory;
  let TokenFactory: Token__factory;
  let UniswapV2FactoryFactory: UniswapV2Factory__factory;
  let UniswapV2LibraryMockFactory: UniswapV2LibraryMock__factory;

  let user: SignerWithAddress;
  let bob: SignerWithAddress;
  let alice: SignerWithAddress;

  before(async () => {
    [user, bob, alice] = await ethers.getSigners();
    ExposedUniswapV2ERC20Factory = (await ethers.getContractFactory(
      "ExposedUniswapV2ERC20",
      user,
    )) as ExposedUniswapV2ERC20__factory;
    UniswapV2PairFactory = (await ethers.getContractFactory("UniswapV2Pair", user)) as UniswapV2Pair__factory;
    UniswapV2FactoryFactory = (await ethers.getContractFactory("UniswapV2Factory", user)) as UniswapV2Factory__factory;
    TokenFactory = (await ethers.getContractFactory("Token", user)) as Token__factory;
    UniswapV2LibraryMockFactory = (await ethers.getContractFactory(
      "UniswapV2LibraryMock",
      user,
    )) as UniswapV2LibraryMock__factory;
  });

  beforeEach(async () => {
    Token1 = await TokenFactory.deploy("Token1", "TK1");
    Token2 = await TokenFactory.deploy("Token2", "TK2");

    UniswapV2Factory = await UniswapV2FactoryFactory.deploy(user.address);
    UniswapV2LibraryMock = await UniswapV2LibraryMockFactory.deploy();
    ExposedUniswapV2ERC20 = await ExposedUniswapV2ERC20Factory.deploy();

    // console.log("Before each");
    // console.log("Token1: ", Token1.address);
    // console.log("Token2: ", Token2.address);
    // console.log("UniswapV2Factory: ", UniswapV2Factory.address);
    // console.log("UniswapV2Pair: ", UniswapV2Pair.address);
    // console.log("UniswapV2LibraryMock: ", await UniswapV2LibraryMock.pairFor(UniswapV2Factory.address, Token1.address, Token2.address));

    const tx = await UniswapV2Factory.createPair(Token1.address, Token2.address);
    const receipt: ContractReceipt = await tx.wait();
    const contractInfo: any = receipt.events?.filter(x => x.event == "PairCreated");
    UniswapV2Pair = (await ethers.getContractAt("UniswapV2Pair", contractInfo[0]["args"][2])) as UniswapV2Pair;
  });

  it("Deploy correctly", async () => {
    expect(await ExposedUniswapV2ERC20.name()).to.be.equal("Uniswap V2");
    expect(await UniswapV2Pair.factory()).to.be.equal(UniswapV2Factory.address);
    console.log("TEST");
    console.log("UniswapV2Pair: ", UniswapV2Pair.address);
    console.log(
      "UniswapV2LibraryMock: ",
      await UniswapV2LibraryMock.pairFor(UniswapV2Factory.address, Token1.address, Token2.address),
    );
  });

  it("mint", async () => {
    let amountToken1 = ethers.utils.parseEther("1");
    let amountToken2 = ethers.utils.parseEther("1");
    await Token1.mint(user.address, amountToken1);
    await Token2.mint(user.address, amountToken1);

    await Token1.transfer(UniswapV2Pair.address, amountToken1);
    await Token2.transfer(UniswapV2Pair.address, amountToken2);

    await expect(UniswapV2Pair.mint(user.address))
      .to.emit(UniswapV2Pair, "Mint")
      .withArgs(user.address, amountToken1, amountToken2);

    let liq = sqrt(amountToken1.mul(amountToken2)).sub(1000);
    expect(await UniswapV2Pair.balanceOf(user.address)).to.be.equal(liq);
  });

  it("mint insufficient liquidity", async () => {
    let amountToken1 = 1000;
    let amountToken2 = 1000;
    await Token1.mint(user.address, amountToken1);
    await Token2.mint(user.address, amountToken1);

    await Token1.transfer(UniswapV2Pair.address, amountToken1);
    await Token2.transfer(UniswapV2Pair.address, amountToken2);

    await expect(UniswapV2Pair.mint(user.address)).to.be.revertedWith("UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED");
  });

  it("mint underflow ", async () => {
    let amountToken1 = 100;
    let amountToken2 = 100;
    await Token1.mint(user.address, amountToken1);
    await Token2.mint(user.address, amountToken1);

    await Token1.transfer(UniswapV2Pair.address, amountToken1);
    await Token2.transfer(UniswapV2Pair.address, amountToken2);

    await expect(UniswapV2Pair.mint(user.address)).to.be.revertedWith(
      "VM Exception while processing transaction: reverted with panic code 0x11",
    );
  });

  it("burn", async () => {
    let amountToken1 = ethers.utils.parseEther("1");
    let amountToken2 = ethers.utils.parseEther("1");
    await Token1.mint(user.address, amountToken1);
    await Token2.mint(user.address, amountToken1);

    await Token1.transfer(UniswapV2Pair.address, amountToken1);
    await Token2.transfer(UniswapV2Pair.address, amountToken2);

    await expect(UniswapV2Pair.mint(user.address))
      .to.emit(UniswapV2Pair, "Mint")
      .withArgs(user.address, amountToken1, amountToken2);

    let liq = sqrt(amountToken1.mul(amountToken2)).sub(1000);
    expect(await UniswapV2Pair.balanceOf(user.address)).to.be.equal(liq);

    await UniswapV2Pair.transfer(UniswapV2Pair.address, liq);

    let returnedAmountToken1 = liq.mul(amountToken1).div(await UniswapV2Pair.totalSupply());
    let returnedAmountToken2 = liq.mul(amountToken2).div(await UniswapV2Pair.totalSupply());

    await expect(UniswapV2Pair.burn(user.address))
      .to.emit(UniswapV2Pair, "Burn")
      .withArgs(user.address, returnedAmountToken1, returnedAmountToken2, user.address);
  });

  it("burn insufficient liq", async () => {
    let amountToken1 = ethers.utils.parseEther("1");
    let amountToken2 = ethers.utils.parseEther("1");
    await Token1.mint(user.address, amountToken1);
    await Token2.mint(user.address, amountToken1);

    await Token1.transfer(UniswapV2Pair.address, amountToken1);
    await Token2.transfer(UniswapV2Pair.address, amountToken2);

    await expect(UniswapV2Pair.mint(user.address))
      .to.emit(UniswapV2Pair, "Mint")
      .withArgs(user.address, amountToken1, amountToken2);

    let liq = sqrt(amountToken1.mul(amountToken2)).sub(1000);
    expect(await UniswapV2Pair.balanceOf(user.address)).to.be.equal(liq);

    await expect(UniswapV2Pair.burn(user.address)).to.be.revertedWith("UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED");
  });

  it("swap", async () => {
    let liq = await addLiquidity(Token1, Token2, user, UniswapV2Pair);
    expect(await UniswapV2Pair.balanceOf(user.address)).to.be.equal(liq);

    await Token1.mint(bob.address, ethers.utils.parseEther("1"));
    await Token1.connect(bob).transfer(UniswapV2Pair.address, ethers.utils.parseEther("0.2"));

    let reserveA;
    let reserveB;
    [reserveA, reserveB] = await UniswapV2LibraryMock.getReserves(
      UniswapV2Factory.address,
      Token1.address,
      Token2.address,
    );

    let amountOut = await UniswapV2LibraryMock.getAmountOut(ethers.utils.parseEther("0.2"), reserveA, reserveB);

    await expect(UniswapV2Pair.connect(bob).swap(BigNumber.from("0"), amountOut, bob.address, []))
      .to.emit(UniswapV2Pair, "Swap")
      .withArgs(
        bob.address,
        BigNumber.from("0"),
        ethers.utils.parseEther("0.2"),
        BigNumber.from("0"),
        amountOut,
        bob.address,
      );
  });
});

async function addLiquidity(Token1: Token, Token2: Token, user: SignerWithAddress, UniswapV2Pair: UniswapV2Pair) {
  let amountToken1 = ethers.utils.parseEther("1");
  let amountToken2 = ethers.utils.parseEther("1");
  await Token1.mint(user.address, amountToken1);
  await Token2.mint(user.address, amountToken1);

  await Token1.transfer(UniswapV2Pair.address, amountToken1);
  await Token2.transfer(UniswapV2Pair.address, amountToken2);

  await expect(UniswapV2Pair.mint(user.address))
    .to.emit(UniswapV2Pair, "Mint")
    .withArgs(user.address, amountToken1, amountToken2);
  let liq = sqrt(amountToken1.mul(amountToken2)).sub(1000);
  return liq;
}

const ONE = ethers.BigNumber.from(1);

const TWO = ethers.BigNumber.from(2);

function sqrt(value: any) {
  let x = ethers.BigNumber.from(value);
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
}
