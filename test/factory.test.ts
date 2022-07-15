import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";

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
  let Token1: Token;
  let Token2: Token;
  let UniswapV2LibraryMock: UniswapV2LibraryMock;

  let ExposedUniswapV2ERC20Factory: ExposedUniswapV2ERC20__factory;
  let UniswapV2PairFactory: UniswapV2Pair__factory;
  let UniswapV2FactoryFactory: UniswapV2Factory__factory;
  let TokenFactory: Token__factory;
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
    UniswapV2Factory = await UniswapV2FactoryFactory.deploy(user.address);
    Token1 = await TokenFactory.deploy("Token1", "TK1");
    Token2 = await TokenFactory.deploy("Token2", "TK2");
    UniswapV2LibraryMock = await UniswapV2LibraryMockFactory.deploy();
  });

  it("Deploy correctly", async () => {
    expect(await UniswapV2Factory.feeToSetter()).to.be.equal(user.address);
  });

  it("fee To", async () => {
    await UniswapV2Factory.setFeeTo(user.address);
    expect(await UniswapV2Factory.feeTo()).to.be.equal(user.address);
  });

  it("fee To failled", async () => {
    await expect(UniswapV2Factory.connect(bob).setFeeTo(user.address)).to.be.revertedWith("UniswapV2: FORBIDDEN");
  });

  it("set fee to setter", async () => {
    await UniswapV2Factory.setFeeToSetter(bob.address);
    expect(await UniswapV2Factory.feeToSetter()).to.be.equal(bob.address);
  });

  it("set fee to setter failled", async () => {
    await expect(UniswapV2Factory.connect(bob).setFeeToSetter(user.address)).to.be.revertedWith("UniswapV2: FORBIDDEN");
  });

  it("create pair", async () => {
    let tokenA;
    let tokenB;

    [tokenA, tokenB] =
      Token1.address.toLowerCase() < Token2.address.toLowerCase()
        ? [Token1.address, Token2.address]
        : [Token2.address, Token1.address];
    await expect(UniswapV2Factory.createPair(Token1.address, Token2.address))
      .to.emit(UniswapV2Factory, "PairCreated")
      .withArgs(tokenA, tokenB, await UniswapV2Factory.getPair(Token1.address, Token2.address), 1);

    expect(await UniswapV2Factory.allPairsLength()).to.be.equal(1);
  });

  it("create a pair with a single token", async () => {
    await expect(UniswapV2Factory.createPair(Token1.address, Token1.address)).to.be.revertedWith(
      "UniswapV2: IDENTICAL_ADDRESSES",
    );
  });

  it("create a pair with a token and address zero", async () => {
    await expect(UniswapV2Factory.createPair(Token1.address, ethers.constants.AddressZero)).to.be.revertedWith(
      "UniswapV2: ZERO_ADDRESS",
    );
    await expect(UniswapV2Factory.createPair(ethers.constants.AddressZero, Token2.address)).to.be.revertedWith(
      "UniswapV2: ZERO_ADDRESS",
    );
  });

  it("create 2 pairs with same tokens", async () => {
    let tokenA;
    let tokenB;

    [tokenA, tokenB] =
      Token1.address.toLowerCase() < Token2.address.toLowerCase()
        ? [Token1.address, Token2.address]
        : [Token2.address, Token1.address];
    await expect(UniswapV2Factory.createPair(Token1.address, Token2.address))
      .to.emit(UniswapV2Factory, "PairCreated")
      .withArgs(tokenA, tokenB, await UniswapV2Factory.getPair(Token1.address, Token2.address), 1);

    await expect(UniswapV2Factory.createPair(Token1.address, Token2.address)).to.be.revertedWith(
      "UniswapV2: PAIR_EXISTS",
    );
  });
});
