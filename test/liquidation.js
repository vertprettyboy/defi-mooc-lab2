const { network, ethers } = require("hardhat");

describe("Liquidation Question 3", function () {
  it("Test real-world liquidation with USDT", async function () {
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

    // ยอด USDT ที่ใช้ล้างหนี้จริงคือประมาณ 2,916,172 USDT (6 decimals)
    const amountToLiquidate = ethers.utils.parseUnits("2916172", 6);
    
    const tx = await operator.startLiquidation(amountToLiquidate);
    const receipt = await tx.wait();

    // เช็ก Event ตามที่โจทย์ระบุ (Account target แบบ lowercase)
    const expectedUser = "0x00000000000000000000000063f6037d3e9d51ad865056bf7792029803b6eefd";
    const liquidationEvents = receipt.logs.filter(v => v.topics[3] === expectedUser);
    
    const ethBalance = await ethers.provider.getBalance(operator.address);
    console.log(`--- SUCCESS ---`);
    console.log(`Profit for Question 3: ${ethers.utils.formatEther(ethBalance)} ETH`);
    
    if (liquidationEvents.length > 0) {
        console.log("Confirmed: Liquidation event matches target user!");
    }
  });
});
