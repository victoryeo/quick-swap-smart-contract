// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./TToken.sol";
import "./GriefingLockTToken.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PrincipalLockTToken {
    TToken private _tokenAddress;
    GriefingLockTToken private _gLockAddress;
    address private _sender;
    address private _receiver;
    uint private _tokenAmount;
    uint private _unlockTime;
    bool private _withdrawn = false;
    bool private _refunded = false;

    event PrincipalTokensLocked(address indexed tokenAddress, address indexed sender, address indexed receiver, uint256 amount, uint256 unlockTime);
    event PrincipalTokensWithdrawn(address indexed tokenAddress, address indexed receiver, uint256 amount);
    event PrincipalTokensRefunded(address indexed tokenAddress, address indexed sender, uint256 amount);

    constructor (address gLockAddress, address tokenAddress, address sender, address receiver, uint tokenAmount, uint unlockTime)
        positiveTokens(tokenAmount)
        validUnlockTime(unlockTime)
    {
        _gLockAddress = GriefingLockTToken(gLockAddress);
        _tokenAddress = TToken(tokenAddress);
        _sender = sender;
        _receiver = receiver;
        _tokenAmount = tokenAmount;
        _unlockTime = unlockTime;
        emit PrincipalTokensLocked(address(_tokenAddress), _sender, _receiver, _tokenAmount, _unlockTime);
    }

    modifier positiveTokens(uint tokenAmount) {
        require(tokenAmount > 0, "Token: Send a positive amount of token");
        _;
    }

    modifier validUnlockTime(uint time) {
        require(time > SafeMath.add(block.timestamp, 180), "Time: Unlock Time must be at least 180 seconds later");
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

    function withdraw() public withdrawable returns (bool) {
        _withdrawn = true;
        _tokenAddress.transfer(_receiver, _tokenAmount);
        emit PrincipalTokensWithdrawn(address(_tokenAddress), _receiver, _tokenAmount);
        return true;
    }
    /**
        @dev
        When Bob grieves, the Griefing Lock's setRefund is called and allows Alice to withdraw Bob's Griefing Sum on Griefing Lock
    */
    function refund() public refundable returns (bool) {
        if (_unlockTime >= block.timestamp) {
            _gLockAddress.setRefund();
        }
        _refunded = true;
        _tokenAddress.transfer(_sender, _tokenAmount);
        emit PrincipalTokensRefunded(address(_tokenAddress), _sender, _tokenAmount);
        return true;
    }
}