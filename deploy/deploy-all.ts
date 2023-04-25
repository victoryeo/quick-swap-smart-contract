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

    console.log("deployed from deployer")
    args[0] = recipient    // quick swap recipient address
    args[1] = 200          // time gap
    const glock1 = await deploy("GriefingLock", {
        from: deployer,
        args: args,
        log: true,
    })

    console.log("deployed from recipient")
    args[0] = deployer     // quick swap recipient address
    args[1] = 200          // time gap
    const glock2 = await deploy("GriefingLock", {
        from: recipient,
        args: args,
        log: true,
    })

    /* not required
    args[0] = glock1.address   // griefing lock recipient address
    args[1] = recipient       // sender
    args[2] = deployer        // receiver
    args[3] = 1               // token amount
    args[4] = 400             // unlock time
    await deploy("PrincipalLock", {
        from: deployer,
        args: args,
        log: true,
    })*/
}

export default func

func.tags = ["All"]
