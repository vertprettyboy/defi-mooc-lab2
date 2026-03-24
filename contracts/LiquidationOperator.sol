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
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant targetUser = 0x63f6037d3e9d51ad865056BF7792029803b6eEfD;

    IAaveLendingPool constant aaveLendingPool = IAaveLendingPool(lendingPoolAddress);

    function startLiquidation(uint256 amountToLiquidate) external {
        address pair = IUniswapV2Factory(factory).getPair(WETH, USDT);
        IUniswapV2Pair(pair).swap(0, amountToLiquidate, address(this), abi.encode(USDT));
    }

    function uniswapV2Call(address, uint, uint amount1, bytes calldata) external {
        IERC20(USDT).approve(lendingPoolAddress, amount1);
        
        // ล้างหนี้ USDT เพื่อยึด WETH (Interface ต้องตรง!)
        aaveLendingPool.liquidationCall(WETH, USDT, targetUser, amount1, false);

        uint256 amountRepayUSDT = (amount1 * 1000) / 997 + 1;
        uint256 wethToRepay = getAmountIn(amountRepayUSDT, msg.sender, WETH, USDT);
        
        IERC20(WETH).transfer(msg.sender, wethToRepay);
        
        uint256 remainingWETH = IERC20(WETH).balanceOf(address(this));
        IWETH(WETH).withdraw(remainingWETH);
    }

    function getAmountIn(uint amountOut, address pairAddress, address tokenIn, address tokenOut) internal view returns (uint amountIn) {
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pairAddress).getReserves();
        (uint reserveIn, uint reserveOut) = tokenIn < tokenOut ? (uint(reserve0), uint(reserve1)) : (uint(reserve1), uint(reserve0));
        amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997) + 1;
    }

    receive() external payable {}
}
