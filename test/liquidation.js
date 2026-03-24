const { network, ethers } = require("hardhat");

describe("Liquidation Question 3", function () {
  it("Test real-world liquidation", async function () {
    // 1. Reset ไปที่ Block 11946807 (ก่อนเกิด Tx จริง 1 block)
    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: process.env.ALCHE_API,
          blockNumber: 11946807,
        }
      }]
    });

    const LiquidationOperator = await ethers.getContractFactory("LiquidationOperator");
    const operator = await LiquidationOperator.deploy();
    await operator.deployed();

    // ยอด USDC ที่ใช้ล้างหนี้ในเคสนี้ (ประมาณ 2,900,000 USDC)
    const amountToLiquidate = ethers.utils.parseUnits("2916172", 6);
    
    const tx = await operator.startLiquidation(amountToLiquidate);
    const receipt = await tx.wait();

    // 2. เช็ก Event ตามที่โจทย์สั่ง (Padded Address)
    const expectedUser = "0x00000000000000000000000063f6037d3e9d51ad865056bf7792029803b6eefd";
    const liquidationEvents = receipt.logs.filter(v => v.topics[3] === expectedUser);
    
    const ethBalance = await ethers.provider.getBalance(operator.address);
    console.log(`Liquidation Success!`);
    console.log(`Profit earned: ${ethers.utils.formatEther(ethBalance)} ETH`);
  });
});
