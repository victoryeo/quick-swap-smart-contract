import { task, types } from "hardhat/config";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import HTLC from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json"

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

      const ttokenContractDeployer = new ethers.Contract(ttokenAddress, TToken.abi, deployer);
      const ttokenContractRecipient = new ethers.Contract(ttokenAddress, TToken.abi, recipient);

      const glockContract = new ethers.Contract(glockAddress, HTLC.abi)
      const glockContractWithDeployer = glockContract.connect(deployer)

      //deploy principalLock
      let nonce = await deployer.getTransactionCount()
      console.log("Nonce", nonce)
      const tx1 = await glockContractWithDeployer.deployPrincipalLock( {nonce:nonce, value:1})
      await tx1.wait()
      console.log('Successfully deploy principal contract address', tx1);
    } catch ({ message }) {
      console.error(message)
    }
  })