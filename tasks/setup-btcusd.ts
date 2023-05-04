import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import { BitGo } from "bitgo";
import { BitGoAPI } from "@bitgo/sdk-api";
import { Tbtc } from "@bitgo/sdk-coin-btc";
import TToken from "../artifacts/contracts/TToken.sol/TToken.json";
import GriefingLock from "../artifacts/contracts/GriefingLock.sol/GriefingLock.json";
import PrincipalLock from "../artifacts/contracts/PrincipalLock.sol/PrincipalLock.json";
import PrincipalLockTToken from "../artifacts/contracts/PrincipalLockTToken.sol/PrincipalLockTToken.json";

require('dotenv').config()

const btcCall = async(
  initiator: string,
  action: string,
  receiver: string,
  newWallet: any, 
  griefingAmount: number) => {  
  try {
    const balance = newWallet.wallet.balanceString();
    if (parseInt(balance, 10) < griefingAmount * 1e8) {
      throw Error(JSON.stringify({error: "Insufficient balance"}))
    }
    await newWallet.wallet.send({
      address: process.env.custodian_btcaddr,
      amount: griefingAmount * 1e8,
      walletPassphrase:  "hellobitgo"
    });
    console.log(`${initiator} successfully ${action} ${griefingAmount} amount of btc to ${receiver}`)
  } catch (err: any) {
    console.log(`${initiator} failed to ${action} w.r.t. ${receiver}`, JSON.stringify(err?.message));
  }
}

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
      let bitgo_access_token = process.env.bitgo_access_token
      if (bitgo_access_token == '') {
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
        bitgo_access_token = access_token.token
      }
      console.log("bitgo_access_token", bitgo_access_token);

      // Initialize the bitgo wallet
      const bitgo = new BitGo({
        accessToken: bitgo_access_token,
        env: 'test',
      })

      const btc_params = {
        "passphrase": "hellobitgo",
        "label": "firstwallet"
      };
      // Create a tbtc wallet
      const newWallet = await bitgo.coin('tbtc').wallets().generateWallet(btc_params);
      console.log(newWallet.wallet.bitgo)
  
      // admin transfer tokens
      const ttoken = new ethers.Contract(ttokenAddress, TToken.abi)
      const ttokenAdmin = ttoken.connect(admin)
      console.log("Admin token balance", await ttokenAdmin.balanceOf(admin.address))
      await ttokenAdmin.approve(admin.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully approve ${griefingAmount}*3 amount of token`)
      await ttokenAdmin.transferFrom(admin.address, bob.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully transfer ${griefingAmount}*3 amount of token to Bob`)

      // admin transfer tokens
      await ttokenAdmin.approve(admin.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully approve ${griefingAmount}*3 amount of token`)
      await ttokenAdmin.transferFrom(admin.address, alice.address, BigNumber.from(griefingAmount*3).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Admin successfully transfer ${griefingAmount}*3 amount of token to Alice`)

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

      console.log('Deploying GriefingLock with BTC token...');
      //let args: any[] = []
      args[0] = ttokenAddress     // token address
      args[1] = bob.address     // quick swap recipient address
      args[2] = griefingAmount    // token amount
      args[3] = 200             // time gap
      const glockContractAlice = glockTTokenContract.connect(alice)
      const glockAlice = await glockContractAlice.deploy(args[0], args[1], args[2], args[3])
      //console.log("Sender", await glockBob.getSender())
      console.log("Alice successfully deployed GriefingLock BTC Token contract", glockBob.address)

      const ttokenAlice = ttoken.connect(alice)
      console.log("Alice token balance", await ttokenAlice.balanceOf(bob.address))
      await ttokenAlice.approve(glockAlice.address, BigNumber.from(griefingAmount).mul(BigNumber.from(10).pow(PWR_INDEX)))
      console.log(`Alice successfully approve ${griefingAmount} amount of token`)
      await glockAlice.depositGriefingToken();
      console.log(`Alice successfully deposit ${griefingAmount} amount of token for griefing`)
      
      // for btc griefing
      btcCall("Alice", "deposit", "custodian", newWallet, griefingAmount)

      console.log('Deploying PrincipalLock...');
      let exchangeAmount = 1
      await ttokenAlice.approve(glockAlice.address, BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      const plockContractAlice = await glockAlice.deployPrincipalLockTToken(BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      await plockContractAlice.wait()
      const alicePrincipalAddress = await glockAlice.getPrincipalLock()
      console.log("Alice's principal lock token address ", alicePrincipalAddress)
      // for btc funding
      btcCall("Alice", "fund", "principal lock", newWallet, griefingAmount)

      await ttokenBob.approve(glockBob.address, BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      const plockContractBob = await glockBob.deployPrincipalLockTToken(BigNumber.from(exchangeAmount*1).mul(BigNumber.from(10).pow(PWR_INDEX)))
      await plockContractBob.wait()
      const bobPrincipalAddress = await glockBob.getPrincipalLock()
      console.log("Bob's principal lock token address ", bobPrincipalAddress)

      const plockAlice = new ethers.Contract(alicePrincipalAddress, PrincipalLock.abi)
      const plockBob = new ethers.Contract(bobPrincipalAddress, PrincipalLockTToken.abi)

      const plockBobAlice = plockBob.connect(alice)
      console.log(`Alice withdraws ${exchangeAmount} USD token from Bob's principal lock token`)
      await plockBobAlice.withdraw();

      const plockAliceBob = plockAlice.connect(bob)
      console.log(`Bob withdraws ${exchangeAmount} btc from Alice's principal lock token`)
      await plockAliceBob.withdraw();
      // for btc withdraw
      btcCall("Bob", "withdraw", "principal lock", newWallet, griefingAmount)

      console.log("Alice refunds from Griefing lock token")
      await glockAlice.refund()
      // for btc refund
      btcCall("Alice", "refund", "custodian", newWallet, griefingAmount)

      console.log("Bob refunds from Griefing lock token")
      await glockBob.refund()  
      
    } catch ({ message }) {
      console.error(message)
    }
  })