import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";

import {
  ExposedUniswapV2ERC20,
  ExposedUniswapV2ERC20__factory,
  UniswapV2ERC20,
  UniswapV2ERC20__factory,
} from "../typechain";

describe("LP tokens tests", async () => {
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

  it("permit function", async () => {
    const provider = ethers.getDefaultProvider("ropsten");
    const wallet = ethers.Wallet.createRandom().connect(provider);

    let someHash = "0x0123456789012345678901234567890123456789012345678901234567890123";
    let someDescr = "Hello World!";

    let payload = ethers.utils.defaultAbiCoder.encode(["bytes32", "string"], [someHash, someDescr]);
    console.log("Payload:", payload);

    let payloadHash = ethers.utils.keccak256(payload);
    console.log("PayloadHash:", payloadHash);

    // See the note in the Solidity; basically this would save 6 gas and
    // can potentially add security vulnerabilities in the future
    // let payloadHash = ethers.utils.solidityKeccak256([ "bytes32", "string" ], [ someHash, someDescr ]);

    let digesthash = "0x708de86615a646821603b6ba99e93a19bb6891195d24e883925a0dfafad30b92";

    let result = await wallet.signMessage(ethers.utils.arrayify(digesthash));

    // let result = await wallet.signMessage(ethers.utils.arrayify(payloadHash));

    // let result = await bob.signMessage("test");
    let r = result.slice(0, 66);
    let s = "0x" + result.slice(66, 130);
    // let v = result.slice(130, 132);
    // let v = BigNumber.from(result.slice(130, 132));

    let sig = ethers.utils.splitSignature(result);

    console.log("Recovered:", ethers.utils.verifyMessage(ethers.utils.arrayify(digesthash), sig));

    let v = BigNumber.from(Number("0x" + result.slice(130, 132)));
    console.log("TEST");
    console.log(user.address);
    console.log(bob.address);
    console.log(wallet.address);
    console.log(v);
    console.log(r);
    console.log(s);
    console.log(sig.v);
    console.log(sig.r);
    console.log(sig.s);
    console.log("FINISH TEST");
    let digest = await UniswapV2ERC20.getDigest(
      bob.address,
      user.address,
      ethers.utils.parseEther("1"),
      Math.round(Date.now() / 1000 + 10000),
    );
    console.log(digest);
    await UniswapV2ERC20.permit2(
      bob.address,
      user.address,
      ethers.utils.parseEther("1"),
      Math.round(Date.now() / 1000 + 10000),
      sig.v,
      sig.r,
      sig.s,
      ethers.utils.arrayify(digesthash),
    );
    expect(await UniswapV2ERC20.allowance(bob.address, user.address)).to.be.equal(ethers.utils.parseEther("1"));
  });
});
