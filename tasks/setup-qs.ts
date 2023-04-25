import { task, types } from "hardhat/config";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json"

task("setup-qs", "Setup Quick Swap")
  .addParam("ttokenAddress", "TToken Contract Address", undefined, types.string)
  .addParam("glockAddress", "GriefingLock Contract Address", undefined, types.string)
  .setAction(async (
    { ttokenAddress, glockAddress }: { ttokenAddress: string, glockAddress: string },
    { ethers }
  ) => {
    try {
      const [deployer, recipient] = await ethers.getSigners();
      console.log("deployer", deployer.address)
      console.log("recipient", recipient.address)

      const Glock = await ethers.getContractFactory('GriefingLock');
      console.log('Deploying GriefingLock...');

      let args: any[] = []
      args[0] = recipient.address     // quick swap recipient address
      args[1] = 200          // time gap
      console.log("deployed from recipient")
      const glock2 = await Glock.deploy(args[0], args[1])

      //const glockContract = new ethers.Contract(glockAddress2, GriefingLock.abi)
      //const glockContractWithRecipient = glockContract.connect(recipient)

      //deploy principalLock
      //let nonce = await recipient.getTransactionCount()
      //console.log("Nonce", nonce)
      const tx1 = await glock2.deployPrincipalLock({value:2})
      const res = await tx1.wait()
      console.log('Successfully deploy principal lock contract address', res.events[1]?.args);

      const Plock = await ethers.getContractFactory('PrincipalLock');
      console.log('Deploying PrincipalLock...');

      args[0] = glockAddress   // griefing lock recipient address
      args[1] = deployer.address       // sender
      args[2] = recipient.address        // receiver
      args[3] = 1               // token amount
      args[4] = 400             // unlock time

      const plock = await Plock.deploy(args[0], args[1], args[2], args[3], args[4]);
      await plock.deployed();
      console.log('Principal lock deployed to:', plock.address);
    } catch ({ message }) {
      console.error(message)
    }
  })