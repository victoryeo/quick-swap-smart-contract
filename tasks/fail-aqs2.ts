import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";
import PrincipalLockTToken from "../artifacts/contracts/PrincipalLockTToken.sol/PrincipalLockTToken.json";

task("fail-aqs2", "Advanced Quick Swap Negative Scenario")
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

      console.log("Alice backs out, Bob refund the tokens in griefing lock")
      console.log("Bob token balance", await ttokenBob.balanceOf(bob.address))
      console.log("Bob refunds from his Griefing lock token")
      await glockBob.refund()
      console.log("Bob token balance", await ttokenBob.balanceOf(bob.address))

    } catch ({ message }) {
      console.error(message)
    }
  })