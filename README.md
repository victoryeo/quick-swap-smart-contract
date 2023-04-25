# quick swap smart contract

For testing of quick swap on evm compatible blockchain, we can use mumbai and goerli testnet. Quick swap is inspired by https://arxiv.org/pdf/2211.15804.pdf  

### compile smart contract
npx hardhat compile

### deploy smart contract to ganache (tested)
npx hardhat deploy --network ganache

### setup quick swap on ganache network (tested)
npx hardhat setup-qs --network ganache
(the address are obtained from hardhat deploy)
