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

      const glockContract = new ethers.Contract(glockAddress, GriefingLock.abi)
      const glockContractWithRecipient = glockContract.connect(recipient)

      //deploy principalLock
      let nonce = await recipient.getTransactionCount()
      console.log("Nonce", nonce)
      const tx1 = await glockContractWithRecipient.deployPrincipalLock( {nonce:nonce, value:1})
      await tx1.wait()
      console.log('Successfully deploy principal contract address', tx1);
    } catch ({ message }) {
      console.error(message)
    }
  })