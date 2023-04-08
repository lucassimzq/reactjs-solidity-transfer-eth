require("@nomicfoundation/hardhat-toolbox");

module.exports = {
	solidity: "0.8.0",
	networks: {
		sepolia: {
			url: "https://eth-sepolia.g.alchemy.com/v2/TXKFrEOTaR0dieNIJCph4sDP_jBPmuex",
			accounts: [
				"edb8ec39fcb29405b53fd7e418bbee85873bfd381f53855cb92ddef0ce53bac2",
			],
		},
	},
};
