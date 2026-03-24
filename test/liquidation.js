const { network, ethers } = require("hardhat");

describe("Liquidation Question 2", function () {
  let liquidationOperator;
  const amounts = ["2000", "5000", "10000"];

  // ฟังก์ชันช่วย Reset Fork ให้กลับไปที่บล็อกเดิมทุกครั้ง
  async function resetFork() {
    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.ALCHE_API,
          blockNumber: 12489619,
        }
      }]
    });
  }

  amounts.forEach((amt) => {
    it(`Should liquidate with ${amt} USDT`, async function () {
      // 1. Reset ทุกอย่างใหม่หมดก่อนเริ่มเทสต์แต่ละเคส
      await resetFork();

      // 2. Deploy สัญญาใหม่ทุกรอบ
      const LiquidationOperator = await ethers.getContractFactory("LiquidationOperator");
      liquidationOperator = await LiquidationOperator.deploy();
      await liquidationOperator.deployed();

      // 3. รันการล้างหนี้
      const tx = await liquidationOperator.operate();
      await tx.wait();
      
      // 4. เช็กยอด ETH ในสัญญา (ที่เป็นกำไร)
      const ethBalance = await ethers.provider.getBalance(liquidationOperator.address);
      console.log(`Profit for ${amt} USDT: ${ethers.utils.formatEther(ethBalance)} ETH`);
    });
  });
});
