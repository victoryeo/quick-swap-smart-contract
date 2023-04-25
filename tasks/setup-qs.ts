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
      console.log("deployed from Bob")
      const glockContractBob = glockContract.connect(bob)
      const glockBob = await glockContractBob.deploy(args[0], args[1])
      console.log("Bob successfully deploy Griefing contract")

      args[0] = bob.address     // quick swap recipient address
      args[1] = 200             // time gap
      console.log("deployed from Alice")
      const glockContractAlice = glockContract.connect(alice)
      const glockAlice = await glockContractAlice.deploy(args[0], args[1])
      console.log("Alice successfully deploy Griefing contract")

      //deploy principalLock
      //let nonce = await recipient.getTransactionCount()
      //console.log("Nonce", nonce)
      const tx1 = await glockAlice.deployPrincipalLock({value:2})
      const res = await tx1.wait()
      console.log('Alice successfully deploy principal lock contract address', res.events[1]?.args);

      const Plock = await ethers.getContractFactory('PrincipalLock');
      console.log('Deploying PrincipalLock...');

      args[0] = glockBob.address  // griefing lock address
      args[1] = bob.address       // sender
      args[2] = alice.address     // receiver
      args[3] = 1               // token amount
      args[4] = 400             // unlock time

      const plock = await Plock.deploy(args[0], args[1], args[2], args[3], args[4]);
      await plock.deployed();
      console.log('Bob deployed Principal lock to:', plock.address);
    } catch ({ message }) {
      console.error(message)
    }
  })