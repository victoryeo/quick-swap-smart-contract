import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
const crypto = require('crypto');

const func: DeployFunction = async function ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    let args: any[] = []
    const { deploy } = deployments
    const { deployer, recipient } = await getNamedAccounts()
    console.log("deploy from account", deployer)
    console.log("htlc recipient", recipient)

    args[0] = "T_NAME"
    args[1] = "T_SYMBOL"
    const ttoken = await deploy("TToken", {
        from: deployer,
        args: args,
        log: true,
    })

    args[0] = recipient  // quick swap recipient address
    args[1] = 2          // time gap
    await deploy("GriefingLock", {
        from: deployer,
        args: args,
        log: true,
    })
}

export default func

func.tags = ["All"]
