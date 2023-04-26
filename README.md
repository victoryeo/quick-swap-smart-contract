# quick swap smart contract

For testing of quick swap on evm compatible blockchain, we can use mumbai and goerli testnet. Quick swap is inspired by https://arxiv.org/pdf/2211.15804.pdf  

### compile smart contract
npx hardhat compile

### deploy smart contract to ganache (tested)
#### this command will deploy a ttoken smart contract
npx hardhat deploy --network ganache

### setup quick swap on ganache network (tested)
#### this command will deploy griefing lock, principal lock
npx hardhat setup-qs --ttoken-address 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab --network ganache
(the address are obtained from hardhat deploy)
