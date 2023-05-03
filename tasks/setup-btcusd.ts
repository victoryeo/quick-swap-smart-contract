import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import { BitGoAPI } from "@bitgo/sdk-api";
import { Tbtc } from "@bitgo/sdk-coin-btc";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";
import PrincipalLockTToken from "../artifacts/contracts/PrincipalLockTToken.sol/PrincipalLockTToken.json";

require('dotenv').config()

task("btcusd-qs", "Perform BTC/USD Quick Swap")
  .addParam("ttokenAddress", " USD Token Contract Address", undefined, types.string)
  .setAction(async (
    { ttokenAddress }: { ttokenAddress: string },
    { ethers }
  ) => {
    try {
      const PWR_INDEX = 0
      const [admin, alice, bob] = await ethers.getSigners();
      console.log("--------Start--------")
      console.log("Alice", alice.address)
      console.log("Bob", bob.address)
      let griefingAmount = 1
      
      // Init Bitgo API
      const newbitgo = new BitGoAPI({ env: 'test' });
      newbitgo.register('tbtc', Tbtc.createInstance);
      console.log("Bitgo username", process.env.username)
      await newbitgo.authenticate({
        username: process.env.username || '',
        password: process.env.password || '',
        otp: "000000",
      });

      // get access token
      const access_token = await newbitgo.addAccessToken({
        otp: "000000",
        label: "Admin Access Token",
        scope: [
          "metamask_institutional",
          "openid",
          "pending_approval_update",
          "portfolio_view",
          "profile",
          "trade_trade",
          "trade_view",
          "wallet_approve_all",
          "wallet_create",
          "wallet_edit_all",
          "wallet_manage_all",
          "wallet_spend_all",
          "wallet_view_all",
        ],
        // Optional: Set a spending limit.
        spendingLimits: [
          {
            coin: "tbtc",
            txValueLimit: "1000000000", // 10 TBTC (10 * 1e8)
          },
        ],
      });
      console.log(access_token);

      const ttoken = new ethers.Contract(ttokenAddress, TToken.abi)
      const ttokenAdmin = ttoken.connect(admin)
      console.log("Admin token balance", await ttokenAdmin.balanceOf(admin.address))
      await ttokenAdmin.approve(admin.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully approve ${griefingAmount}*3 amount of token`)
      await ttokenAdmin.transferFrom(admin.address, bob.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully transfer ${griefingAmount}*3 amount of token to Bob`)

      const glockTTokenContract = await ethers.getContractFactory('GriefingLockTToken');
      console.log('Deploying GriefingLock with USD Token...');

      let args: any[] = []
      args[0] = ttokenAddress     // token address
      args[1] = alice.address     // quick swap recipient address
      args[2] = griefingAmount    // token amount
      args[3] = 200             // time gap
      const glockContractBob = glockTTokenContract.connect(bob)
      const glockBob = await glockContractBob.deploy(args[0], args[1], args[2], args[3])
      //console.log("Sender", await glockBob.getSender())
      console.log("Bob successfully deployed GriefingLock USD Token contract", glockBob.address)

      const ttokenBob = ttoken.connect(bob)
      console.log("Bob token balance", await ttokenBob.balanceOf(bob.address))
      await ttokenBob.approve(glockBob.address, BigNumber.from(griefingAmount).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Bob successfully approve ${griefingAmount} amount of token`)
      await glockBob.depositGriefingToken();
      console.log(`Bob successfully deposit ${griefingAmount} amount of token for griefing`)

      /*
      const glockContract = await ethers.getContractFactory('GriefingLock');
      console.log('Deploying GriefingLock...');
      args[0] = bob.address     // quick swap recipient address
      args[1] = 200             // time gap
      const glockContractAlice = glockContract.connect(alice)
      const glockAlice = await glockContractAlice.deploy(args[0], args[1])
      console.log("Alice successfully deployed Griefing contract", glockAlice.address)
      await glockAlice.depositGriefingAmount({value: griefingAmount});
      console.log(`Alice successfully deposit ${griefingAmount} amount of ether for griefing`)

      console.log('Deploying PrincipalLock...');
      let exchangeAmount = 2
      const plockContractAlice = await glockAlice.deployPrincipalLock({value:exchangeAmount})
      const res = await plockContractAlice.wait()
      let alicePrincipalAddress = res.events[1]?.args.principalAddress;
      let unlockTime = Number(res.events[1]?.args.unlockTime)
      console.log('Alice successfully deploy principal lock contract address', alicePrincipalAddress, "with unlockTime", unlockTime);

      console.log("Alice's principal lock address ", (await glockAlice.getPrincipalLock()))

      await ttokenBob.approve(glockBob.address, BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      const plockContractBob = await glockBob.deployPrincipalLockTToken(BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      await plockContractBob.wait()
      const bobPrincipalAddress = await glockBob.getPrincipalLock()
      console.log("Bob's principal lock token address ", bobPrincipalAddress)

      const plockAlice = new ethers.Contract(alicePrincipalAddress, PrincipalLock.abi)
      const plockBob = new ethers.Contract(bobPrincipalAddress, PrincipalLockTToken.abi)

      const plockBobAlice = plockBob.connect(alice)
      console.log(`Alice withdraws ${exchangeAmount} token from Bob's principal lock token`)
      await plockBobAlice.withdraw();

      const plockAliceBob = plockAlice.connect(bob)
      console.log(`Bob withdraws ${exchangeAmount} ether from Alice's principal lock`)
      await plockAliceBob.withdraw();

      console.log("Alice refunds from Griefing lock")
      await glockAlice.refund()

      console.log("Bob refunds from Griefing lock token")
      await glockBob.refund()  
      */
    } catch ({ message }) {
      console.error(message)
    }
  })