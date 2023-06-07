// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./GriefingLock.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PrincipalLock {
    uint private constant MIN_TIME_GAP = 180;
    GriefingLock private _gLockAddress;
    address private _sender;
    address private _receiver;
    uint private _amount;
    uint private _unlockTime;
    bool private _withdrawn = false;
    bool private _refunded = false;

    event PrincipalDeployed(address indexed sender, address indexed receiver, uint256 amount, uint256 unlockTime);
    event PrincipalWithdrawn(address indexed receiver, uint256 amount, bool result);
    event PrincipalRefunded(address indexed sender, uint256 amount);

    constructor (address gLockAddress, address sender, address receiver, uint tokenAmount, uint unlockTime)
        positiveTokens(tokenAmount)
        validUnlockTime(unlockTime)
    {
        _gLockAddress = GriefingLock(gLockAddress);
        _sender = sender;
        _receiver = receiver;
        _amount = tokenAmount;
        _unlockTime = unlockTime;
        emit PrincipalDeployed(_sender, _receiver, _amount, _unlockTime);
    }

    modifier positiveTokens(uint tokenAmount) {
        require(tokenAmount > 0, "Token: Send a positive amount of token");
        _;
    }

    modifier validUnlockTime(uint time) {
        //require(time > SafeMath.add(block.timestamp, 180), "Time: Unlock Time must be at least 180 seconds later");
        // TBR
        //require(time > MIN_TIME_GAP, "Time: Unlock Time must be at least 180 seconds later");
        _;
    }

    modifier withdrawable() {
        require(
            _receiver == msg.sender,
            "Withdrawal: Not Stipulated Receiver"
        );
        require(
            _withdrawn == false,
            "Withdrawal: Already Withdrawn"
        );
        require(
            _unlockTime >= block.timestamp,
            "Withdrawal: Unlock Time has Elapsed"
        );
        _;
    }

    modifier refundable() {
        require(
            _sender == msg.sender,
            "Refund: Not Sender, please use the correct account"
        );
        require(
            _refunded == false,
            "Refund: Already Refunded"
        );
        require(
            _withdrawn == false,
            "Refund: You may not refund as a withdrawal has been processed"
        );
        _;
    }

    function withdraw() external payable withdrawable returns (bool) {
        _withdrawn = true;
        bool success = false;
        (success, ) = payable(_receiver).call{value: _amount, gas: 50000}("");
        emit PrincipalWithdrawn(_receiver, _amount, success);
        return success;
    }
    /**
        @dev
        When Bob grieves, the Griefing Lock's setRefund is called and allows Alice to withdraw Bob's Griefing Sum on Griefing Lock
    */
    function refund() public payable refundable returns (bool) {
        bool success = false;
        if (_unlockTime >= block.timestamp) {
            _gLockAddress.setRefund();
        }
        _refunded = true;
        (success, ) = payable(_sender).call{value: _amount, gas: 50000}("");
        emit PrincipalRefunded(_sender, _amount);
        return success;
    }

    function getUnlockTime() public view returns (uint) {
        return _unlockTime;
    }

    receive() external payable {}
    fallback() external payable {}
}