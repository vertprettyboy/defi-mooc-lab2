const { network, ethers } = require("hardhat");

describe("Liquidation Question 2", function () {
  let liquidationOperator;
  const amounts = ["2000", "5000", "10000"];

  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.ALCHE_API,
          blockNumber: 12489619,
        }
      }]
    });

    const LiquidationOperator = await ethers.getContractFactory("LiquidationOperator");
    liquidationOperator = await LiquidationOperator.deploy();
    await liquidationOperator.deployed();
  });

  amounts.forEach((amt) => {
    it(`Should liquidate with ${amt} USDT`, async function () {
      const tx = await liquidationOperator.operate();
      await tx.wait();
      
      const ethBalance = await ethers.provider.getBalance(liquidationOperator.address);
      console.log(`Profit for ${amt} USDT: ${ethers.utils.formatEther(ethBalance)} ETH`);
    });
  });
});
