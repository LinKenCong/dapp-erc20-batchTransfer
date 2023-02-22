// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// StakeTestCoin import
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestCoin is ERC20 {
    constructor() ERC20("TestCoin", "TCT") {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    function ethToWei(uint256 amount) public view returns (uint256) {
        return amount * 10 ** decimals();
    }

    function weiToEth(uint256 amount) public view returns (uint256) {
        return amount / 10 ** decimals();
    }

    function send1000ToAccount(address account) external {
        transfer(account, ethToWei(1000));
    }
}
