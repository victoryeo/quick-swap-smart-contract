import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    let args: any[] = []
    const { deploy } = deployments
    const { admin, alice, bob } = await getNamedAccounts()
    console.log("deploy from account", admin)
    console.log("quickswap users", alice, bob)

    args[0] = "T_NAME"
    args[1] = "T_SYMBOL"
    const ttoken = await deploy("TToken", {
        from: admin,
        args: args,
        log: true,
    })

    /* not required
    console.log("deployed from bob")
    args[0] = alice        // quick swap recipient address
    args[1] = 200          // time gap
    const glock1 = await deploy("GriefingLock", {
        from: bob,
        args: args,
        log: true,
    })*/

    /* not required
    console.log("deployed from alice")
    args[0] = bob     // quick swap recipient address
    args[1] = 200          // time gap
    const glock2 = await deploy("GriefingLock", {
        from: alice,
        args: args,
        log: true,
    })*/

    /* not required
    args[0] = glock1.address   // griefing lock recipient address
    args[1] = alice       // sender
    args[2] = bob        // receiver
    args[3] = 1               // token amount
    args[4] = 400             // unlock time
    await deploy("PrincipalLock", {
        from: alice,
        args: args,
        log: true,
    })*/
}

export default func

func.tags = ["All"]
