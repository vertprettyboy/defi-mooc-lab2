// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IAaveLendingPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IWETH.sol";

contract LiquidationOperator {
    address constant factory = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant lendingPoolAddress = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    
    // ข้อ 3: ต้องใช้ USDT และ WETH ตาม Transaction จริงใน Etherscan
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant targetUser = 0x63f6037d3e9d51ad865056BF7792029803b6eEfD;

    IAaveLendingPool constant aaveLendingPool = IAaveLendingPool(lendingPoolAddress);

    function startLiquidation(uint256 amountToLiquidate) external {
        // กู้ USDT จากคู่ WETH/USDT บน Uniswap
        address pair = IUniswapV2Factory(factory).getPair(WETH, USDT);
        IUniswapV2Pair(pair).swap(0, amountToLiquidate, address(this), abi.encode(USDT));
    }

    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external {
        uint256 amountBorrowed = amount1 > 0 ? amount1 : amount0;
        
        IERC20(USDT).approve(lendingPoolAddress, amountBorrowed);
        // ล้างหนี้ USDT เพื่อยึด WETH ออกมา
        aaveLendingPool.liquidationCall(WETH, USDT, targetUser, amountBorrowed, false);

        // คำนวณเงินต้น + ค่าธรรมเนียม 0.3% เพื่อคืน Flash Swap
        uint256 amountRepayUSDT = (amountBorrowed * 1000) / 997 + 1;
        IERC20(USDT).transfer(msg.sender, amountRepayUSDT);
        
        // กำไรที่เหลือคือ WETH -> แลกเป็น ETH ออกมาโชว์ในรายงาน
        uint256 remainingWETH = IERC20(WETH).balanceOf(address(this));
        IWETH(WETH).withdraw(remainingWETH);
    }

    receive() external payable {}
}
