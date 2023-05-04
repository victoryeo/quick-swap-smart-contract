import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";
import PrincipalLockTToken from "../artifacts/contracts/PrincipalLockTToken.sol/PrincipalLockTToken.json";

task("fail-aqs", "Advanced Quick Swap Negative Scenario")
  .addParam("ttokenAddress", "TToken Contract Address", undefined, types.string)
  .setAction(async (
    { ttokenAddress }: { ttokenAddress: string },
    { ethers }
  ) => {
    try {
      const PWR_INDEX = 0
      const [admin, alice, bob] = await ethers.getSigners();
      console.log("--------Start--------")
      console.log("Alice", alice.address)
      console.log("Bob", bob.address)
      let griefingAmount = 1

      const ttoken = new ethers.Contract(ttokenAddress, TToken.abi)
      const ttokenAdmin = ttoken.connect(admin)
      console.log("Admin token balance", await ttokenAdmin.balanceOf(admin.address))
      await ttokenAdmin.approve(admin.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully approve ${griefingAmount}*3 amount of token`)
      await ttokenAdmin.transferFrom(admin.address, bob.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully transfer ${griefingAmount}*3 amount of token to Bob`)

      const glockTTokenContract = await ethers.getContractFactory('GriefingLockTToken');
      console.log('Deploying GriefingLock with TToken...');

      let args: any[] = []
      args[0] = ttokenAddress     // token address
      args[1] = alice.address     // quick swap recipient address
      args[2] = griefingAmount    // token amount
      args[3] = 200             // time gap
      const glockContractBob = glockTTokenContract.connect(bob)
      const glockBob = await glockContractBob.deploy(args[0], args[1], args[2], args[3])
      //console.log("Sender", await glockBob.getSender())
      console.log("Bob successfully deployed GriefingLock TToken contract", glockBob.address)

      const ttokenBob = ttoken.connect(bob)
      console.log("Bob token balance", await ttokenBob.balanceOf(bob.address))
      await ttokenBob.approve(glockBob.address, BigNumber.from(griefingAmount).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Bob successfully approve ${griefingAmount} amount of token`)
      await glockBob.depositGriefingToken();
      console.log(`Bob successfully deposit ${griefingAmount} amount of token for griefing`)

      const glockContract = await ethers.getContractFactory('GriefingLock');
      console.log('Deploying GriefingLock...');
      args[0] = bob.address     // quick swap recipient address
      args[1] = 200             // time gap
      const glockContractAlice = glockContract.connect(alice)
      const glockAlice = await glockContractAlice.deploy(args[0], args[1])
      console.log("Alice successfully deployed Griefing contract", glockAlice.address)
      await glockAlice.depositGriefingAmount({value: griefingAmount});
      console.log(`Alice successfully deposit ${griefingAmount} amount of ether for griefing`)

      console.log('Deploying PrincipalLock...');
      let exchangeAmount = 2
      const plockContractAlice = await glockAlice.deployPrincipalLock({value:exchangeAmount})
      const res = await plockContractAlice.wait()
      let alicePrincipalAddress = res.events[1]?.args.principalAddress;
      let unlockTime = Number(res.events[1]?.args.unlockTime)
      console.log('Alice successfully deploy principal lock contract address', alicePrincipalAddress, "with unlockTime", unlockTime);

      console.log("Alice's principal lock address ", (await glockAlice.getPrincipalLock()))

      const ttokenAlice = ttoken.connect(alice)
      console.log("Alice ether balance", await alice.getBalance())
      console.log("Alice token balance", await ttokenAlice.balanceOf(alice.address))
      console.log("Bob backs up, Alice withdraw the tokens in griefing lock")
      await glockBob.connect(alice).withdraw()
      console.log("Alice ether balance", await alice.getBalance())
      console.log("Alice token balance", await ttokenAlice.balanceOf(alice.address))

    } catch ({ message }) {
      console.error(message)
    }
  })