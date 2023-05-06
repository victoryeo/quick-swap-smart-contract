# quick swap smart contract

For testing of quick swap on evm compatible blockchain, we can use mumbai and goerli testnet. Quick swap is inspired by https://arxiv.org/pdf/2211.15804.pdf  

### quick swap essence
Alice and Bob want to withdraw their principal amounts/tokens on different chains / same chain. (ie Bob deploys PLT on Besu, Alice deploys PL on Goerli, Bob withdraws Alice’s PL and Alice withdraws Bob’s PLT)

The principal lock is used to exchange the principal amounts/tokens they want to exchange in the first place.

The griefing lock is an extension of HTLC to account for the risks if either party backs out from the exchange of amounts/tokens. The griefing amount is the opportunity costs of locking in HTLC, paid by the party that backs out.

### compile smart contract
npx hardhat compile

### deploy smart contract to ganache (tested)
#### this command will deploy a ttoken smart contract
npx hardhat deploy --network ganache

### setup basic quick swap on ganache network (tested)
#### this command will deploy griefing lock, principal lock
npx hardhat basic-qs --ttoken-address 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab --network ganache
(the address are obtained from hardhat deploy)

### setup advanced quick swap on ganache network (tested)
#### this command will deploy griefing lock, griefing token lock, principal lock
npx hardhat advanced-qs --ttoken-address 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab --network ganache
(the address are obtained from hardhat deploy)

### Btc/Usd quick swap on ganache network (tested)
#### this also uses BitGo API to send testnet Btc
npx hardhat btcusd-qs  --ttoken-address 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab --network ganache

