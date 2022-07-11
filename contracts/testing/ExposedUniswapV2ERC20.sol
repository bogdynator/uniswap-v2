pragma solidity ^0.8.15;

import "../v2-core/UniswapV2ERC20.sol";

contract ExposedUniswapV2ERC20 is UniswapV2ERC20 {
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) external {
        _burn(to, amount);
    }
}
