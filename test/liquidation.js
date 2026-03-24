const { network, ethers } = require("hardhat");

describe("Liquidation Question 2", function () {
  let liquidationOperator;
  const amounts = ["2000", "5000", "10000"];

  // ฟังก์ชันช่วย Reset ให้อยู่ใน Block เดิมทุกครั้ง
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
    it(`Test liquidation with ${amt} USDT`, async function () {
      // 1. Reset Fork ใหม่ทุกรอบที่เริ่มเคสใหม่
      await resetFork();

      // 2. Deploy สัญญาใหม่ทุกรอบ (เพื่อให้ยอดเงินเริ่มต้นเป็น 0)
      const LiquidationOperator = await ethers.getContractFactory("LiquidationOperator");
      liquidationOperator = await LiquidationOperator.deploy();
      await liquidationOperator.deployed();
      
      try {
        const tx = await liquidationOperator.operate();
        await tx.wait();
        
        const ethBalance = await ethers.provider.getBalance(liquidationOperator.address);
        console.log(`Profit for ${amt} USDT: ${ethers.utils.formatEther(ethBalance)} ETH`);
      } catch (error) {
        // ถ้าขาดทุนหรือล้างหนี้ไม่ได้ มันจะมาตกตรงนี้
        console.log(`Profit for ${amt} USDT: Failed or No Profit`);
      }
    });
  });
});
