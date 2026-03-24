const { network, ethers } = require("hardhat");

describe("Liquidation Question 2", function () {
  const amounts = ["2000", "5000", "10000"];

  amounts.forEach((amt) => {
    it(`Test liquidation with ${amt} USDT`, async function () {
      // 1. Reset Fork กลับไปที่ Block เดิมทุกครั้งที่เริ่ม Test Case ใหม่
      await network.provider.request({
        method: "hardhat_reset",
        params: [{
          forking: {
            jsonRpcUrl: process.env.ALCHE_API,
            blockNumber: 12489619,
          }
        }]
      });

      // 2. Deploy ใหม่ทุกรอบ
      const LiquidationOperator = await ethers.getContractFactory("LiquidationOperator");
      const operator = await LiquidationOperator.deploy();
      await operator.deployed();
      
      // 3. รันสัญญา
      const tx = await operator.operate();
      await tx.wait();
      
      const ethBalance = await ethers.provider.getBalance(operator.address);
      console.log(`Profit for ${amt} USDT: ${ethers.utils.formatEther(ethBalance)} ETH`);
    });
  });
});
