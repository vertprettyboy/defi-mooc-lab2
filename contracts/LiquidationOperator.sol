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
    
    // ข้อ 3: ใช้ USDC และ WETH ตาม Transaction จริง
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant targetUser = 0x63f6037d3e9d51ad865056BF7792029803b6eEfD;

    IAaveLendingPool constant aaveLendingPool = IAaveLendingPool(lendingPoolAddress);

    function startLiquidation(uint256 amountToLiquidate) external {
        // กู้ USDC จากคู่ WETH/USDC
        address pair = IUniswapV2Factory(factory).getPair(WETH, USDC);
        IUniswapV2Pair(pair).swap(0, amountToLiquidate, address(this), abi.encode(USDC));
    }

    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external {
        uint256 amountBorrowed = amount1 > 0 ? amount1 : amount0;
        
        IERC20(USDC).approve(lendingPoolAddress, amountBorrowed);
        // ล้างหนี้ USDC ยึด WETH
        aaveLendingPool.liquidationCall(WETH, USDC, targetUser, amountBorrowed, false);

        // คืนเงินกู้ Flash Swap
        uint256 amountRepayUSDC = (amountBorrowed * 1000) / 997 + 1;
        IERC20(USDC).transfer(msg.sender, amountRepayUSDC);
        
        // กำไรที่เหลือในรูป WETH แลกเป็น ETH
        uint256 remainingWETH = IERC20(WETH).balanceOf(address(this));
        IWETH(WETH).withdraw(remainingWETH);
    }

    receive() external payable {}
}
