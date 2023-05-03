import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";
import PrincipalLockTToken from "../artifacts/contracts/PrincipalLockTToken.sol/PrincipalLockTToken.json";

task("advanced-qs", "Perform Advanced Quick Swap")
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
      await ttokenAdmin.approve(admin.address, BigNumber.from(griefingAmount*2).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully approve ${griefingAmount}*1 amount of token`)
      await ttokenAdmin.transferFrom(admin.address, bob.address, BigNumber.from(griefingAmount*2).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully transfer ${griefingAmount}*1 amount of token to Bob`)

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
      const plockContractAlice = await glockAlice.deployPrincipalLock({value:2})
      const res = await plockContractAlice.wait()
      let alicePrincipalAddress = res.events[1]?.args.principalAddress;
      let unlockTime = Number(res.events[1]?.args.unlockTime)
      console.log('Alice successfully deploy principal lock contract address', alicePrincipalAddress, "with unlockTime", unlockTime);

      console.log("Alice's principal lock address ", (await glockAlice.getPrincipalLock()))

      /*const plockContract = await ethers.getContractFactory('PrincipalLock');

      args[0] = glockBob.address  // griefing lock address
      args[1] = bob.address       // sender
      args[2] = alice.address     // receiver
      args[3] = 1                 // token amount
      args[4] = unlockTime + 400             // unlock time

      const plockContractBob = plockContract.connect(bob)
      const plockBob = await plockContractBob.deploy(args[0], args[1], args[2], args[3], args[4]);*/

      await ttokenBob.approve(glockBob.address, BigNumber.from(griefingAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      const plockContractBob = await glockBob.deployPrincipalLockTToken(BigNumber.from(griefingAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      await plockContractBob.wait()
      const bobPrincipalAddress = await glockBob.getPrincipalLock()
      console.log("Bob's principal lock token address ", bobPrincipalAddress)

      const plockAlice = new ethers.Contract(alicePrincipalAddress, PrincipalLock.abi)
      const plockBob = new ethers.Contract(bobPrincipalAddress, PrincipalLockTToken.abi)

      const plockBobAlice = plockBob.connect(alice)
      console.log("Alice withdraws from Bob's principal lock token")
      await plockBobAlice.withdraw();

      const plockAliceBob = plockAlice.connect(bob)
      console.log("Bob withdraws from Alice's principal lock")
      await plockAliceBob.withdraw();

      console.log("Alice refunds from Griefing lock")
      await glockAlice.refund()

      console.log("Bob refunds from Griefing lock token")
      await glockBob.refund()
    } catch ({ message }) {
      console.error(message)
    }
  })