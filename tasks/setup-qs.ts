import { task, types } from "hardhat/config";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json"

task("setup-qs", "Setup Quick Swap")
  .addParam("ttokenAddress", "TToken Contract Address", undefined, types.string)
  .setAction(async (
    { ttokenAddress }: { ttokenAddress: string },
    { ethers }
  ) => {
    try {
      const [admin, alice, bob] = await ethers.getSigners();
      console.log("alice", alice.address)
      console.log("bob", bob.address)

      const glockContract = await ethers.getContractFactory('GriefingLock');
      console.log('Deploying GriefingLock...');

      let args: any[] = []
      args[0] = alice.address     // quick swap recipient address
      args[1] = 200             // time gap
      const glockContractBob = glockContract.connect(bob)
      const glockBob = await glockContractBob.deploy(args[0], args[1])
      console.log("Bob successfully deployed Griefing contract", glockBob.address)

      args[0] = bob.address     // quick swap recipient address
      args[1] = 200             // time gap
      const glockContractAlice = glockContract.connect(alice)
      const glockAlice = await glockContractAlice.deploy(args[0], args[1])
      console.log("Alice successfully deployed Griefing contract", glockAlice.address)

      //deploy principalLock
      //let nonce = await recipient.getTransactionCount()
      //console.log("Nonce", nonce)
      const plockAlice = await glockAlice.deployPrincipalLock({value:2})
      const res = await plockAlice.wait()
      console.log('Alice successfully deploy principal lock contract address', res.events[1]?.args);

      const plockContract = await ethers.getContractFactory('PrincipalLock');
      console.log('Deploying PrincipalLock...');

      args[0] = glockBob.address  // griefing lock address
      args[1] = bob.address       // sender
      args[2] = alice.address     // receiver
      args[3] = 1               // token amount
      args[4] = 400             // unlock time

      const plockContractBob = plockContract.connect(bob)
      const plockBob = await plockContractBob.deploy(args[0], args[1], args[2], args[3], args[4]);
      console.log('Bob deployed Principal lock to:', plockBob.address);

      const plockBobAlice = plockBob.connect(alice)
      await plockBobAlice.withdraw();
      //await plockAlice.withdraw();

    } catch ({ message }) {
      console.error(message)
    }
  })