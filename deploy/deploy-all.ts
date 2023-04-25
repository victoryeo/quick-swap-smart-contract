import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    let args: any[] = []
    const { deploy } = deployments
    const { deployer, recipient } = await getNamedAccounts()
    console.log("deploy from account", deployer)
    console.log("quickswap recipient", recipient)

    args[0] = "T_NAME"
    args[1] = "T_SYMBOL"
    const ttoken = await deploy("TToken", {
        from: deployer,
        args: args,
        log: true,
    })

    args[0] = recipient    // quick swap recipient address
    args[1] = 200          // time gap
    const glock = await deploy("GriefingLock", {
        from: deployer,
        args: args,
        log: true,
    })

    args[0] = glock.address   // griefing lock recipient address
    args[1] = recipient       // sender
    args[2] = deployer        // receiver
    args[3] = 1               // token amount
    args[4] = 400             // unlock time
    await deploy("PrincipalLock", {
        from: deployer,
        args: args,
        log: true,
    })
}

export default func

func.tags = ["All"]
