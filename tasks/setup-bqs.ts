import { task, types } from "hardhat/config";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";

task("basic-qs", "Perform Basic Quick Swap")
  .addParam("ttokenAddress", "TToken Contract Address", undefined, types.string)
  .setAction(async (
    { ttokenAddress }: { ttokenAddress: string },
    { ethers }
  ) => {
    try {
      const [admin, alice, bob] = await ethers.getSigners();
      console.log("--------Start--------")
      console.log("Alice", alice.address)
      console.log("Bob", bob.address)

      const glockContract = await ethers.getContractFactory('GriefingLock');
      console.log('Deploying GriefingLock...');

      let args: any[] = []
      args[0] = alice.address     // quick swap recipient address
      args[1] = 200             // time gap
      const glockContractBob = glockContract.connect(bob)
      const glockBob = await glockContractBob.deploy(args[0], args[1])
      console.log("Bob successfully deployed Griefing contract", glockBob.address)

      let griefingAmount = 1
      await glockBob.depositGriefingAmount({value: griefingAmount});
      console.log(`Bob successfully deposit ${griefingAmount} amount of ether for griefing`)

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
      let principalAddress = res.events[1]?.args.principalAddress;
      let unlockTime = Number(res.events[1]?.args.unlockTime)
      console.log('Alice successfully deploy principal lock contract address', principalAddress, "with unlockTime", unlockTime);

      console.log("Alice's principal lock address ", (await glockAlice.getPrincipalLock()))

      const plockContract = await ethers.getContractFactory('PrincipalLock');

      args[0] = glockBob.address  // griefing lock address
      args[1] = bob.address       // sender
      args[2] = alice.address     // receiver
      args[3] = 1                 // token amount
      args[4] = unlockTime + 400             // unlock time

      const plockContractBob = plockContract.connect(bob)
      const plockBob = await plockContractBob.deploy(args[0], args[1], args[2], args[3], args[4]);
      console.log('Bob deployed Principal lock to:', plockBob.address);

      const plockAlice = new ethers.Contract(principalAddress, PrincipalLock.abi)

      const plockBobAlice = plockBob.connect(alice)
      console.log("Alice withdraws from Bob's principal lock")
      await plockBobAlice.withdraw();

      const plockAliceBob = plockAlice.connect(bob)
      console.log("Bob withdraws from Alice's principal lock")
      await plockAliceBob.withdraw();

      console.log("Alice refunds from Griefing lock")
      await glockAlice.refund()

      console.log("Bob refunds from Griefing lock")
      await glockBob.refund()
    } catch ({ message }) {
      console.error(message)
    }
  })