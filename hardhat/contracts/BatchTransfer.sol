// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BatchTransfer is Ownable {
    // using SafeERC20 for IERC20;
    uint256 public fee;

    function batchTransfer(address _token, address[] calldata _tos, uint256 _amount) external payable payFee {
        IERC20 token = IERC20(_token);
        require(token.allowance(msg.sender, address(this)) >= _tos.length * _amount, "Need approve ERC20 token");
        for (uint8 i = 0; i < _tos.length; i++) {
            token.transferFrom(msg.sender, _tos[i], _amount);
        }
    }

    function batchCall(address _token, address[] calldata _tos, uint256 _amount) external payable payFee {
        require(IERC20(_token).balanceOf(address(this)) >= _tos.length * _amount, "Contract need sufficient balance");
        for (uint8 i = 0; i < _tos.length; i++) {
            bytes memory callData = abi.encodeWithSignature("transfer(address,uint256)", _tos[i], _amount);
            (bool success, ) = address(_token).call(callData);
            require(success, "BatchTransfer: call failed");
        }
    }

    function updateFee(uint256 _newFee) external onlyOwner {
        fee = _newFee;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert("withdraw error");
    }

    modifier payFee() {
        require(msg.value >= fee, "Need pay fee");
        _;
    }

    receive() external payable {}

    fallback() external payable {}
}
