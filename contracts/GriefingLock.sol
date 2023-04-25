// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./PrincipalLock.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

//

// Remove the tokens, only make it payable and use goETH only
// Listens for deployment event
// To extend this further, we need logic to mandate that Goerli Sender locks up 1.5Q in application

contract GriefingLock is Ownable {
    uint private constant MIN_TIME_GAP = 180;
    address private _pLockAddress = address(0);
    address private _sender;
    address private _receiver;
    uint private _amount;
    uint private _timeGap;
    uint private _unlockTime;
    bool private _withdrawn = false;
    bool private _refunded = false;
    bool private _accessible = false;

    event GriefingLockCreated(address indexed sender, address indexed receiver, uint256 unlockTime);
    event GriefingLocked(address indexed sender, address indexed receiver, uint256 amount, uint256 unlockTime);
    event GriefingWithdrawn(address indexed receiver, uint256 amount);
    event PrincipalLocked(address indexed principalAddress, uint256 amount, uint256 unlockTime);
    event GriefingRefunded(address indexed sender, uint256 amount);

    constructor (address receiver, uint timeGap)
        validUnlockTime(timeGap)
    {
        _sender = owner();
        _receiver = receiver;
        _timeGap = timeGap;
        _unlockTime = SafeMath.add(block.timestamp, _timeGap);
        emit GriefingLockCreated(_sender, _receiver, _unlockTime);
    }

    modifier positiveTokenCollateral(uint tokenAmount) {
        require(tokenAmount > 0, "Token: Send a positive amount of token");
        _;
    }

    modifier validUnlockTime(uint timeGap) {
        require(timeGap >= MIN_TIME_GAP, string(abi.encodePacked("Time: Unlock Time must be at least ", Strings.toString(MIN_TIME_GAP), " seconds later")));
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
            _accessible == false,
            "Withdrawal: Principal Lock is deployed. Claim your funds"
        );
        require(
            _unlockTime < block.timestamp,
            "Withdrawal: Unlock Time has yet to pass"
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
        require(
            _unlockTime < block.timestamp,
            "Refund: Please wait for timelock to pass"
        );
        _;
    }

    function depositGriefingTokens() external payable onlyOwner {
        _amount = msg.value;
        emit GriefingLocked(_sender, _receiver, _amount, _unlockTime);
    }

    function deployPrincipalLock() external payable onlyOwner returns(PrincipalLock) {
        _accessible = true;
        PrincipalLock principalContract = new PrincipalLock(address(this), _sender, _receiver, msg.value, SafeMath.add(_unlockTime, _timeGap));
        _pLockAddress = address(principalContract);
        payable(_pLockAddress).transfer(msg.value);
        emit PrincipalLocked(address(principalContract), msg.value, SafeMath.add(_unlockTime, _timeGap));
        return principalContract;
    }

    function withdraw() public payable withdrawable returns (bool) {
        _withdrawn = true;
        payable(_receiver).transfer(_amount);
        emit GriefingWithdrawn(_receiver, _amount);
        return true;
    }

    function refund() public payable refundable onlyOwner returns (bool) {
        _refunded = true;
        payable(_sender).transfer(_amount);
        emit GriefingRefunded(_sender, _amount);
        return true;
    }

    /**
        @dev
        We prevent Bob from changing the time after deploying the Principal Lock to prevent malicious actions
        We use _pLockAddress instead of _accessible as _accessible will be set to false to allow Alice to withdraw Bob's Griefing Sum if Bob griefs
    */

    function changeTimeGap(uint newTimeGap) public onlyOwner validUnlockTime(newTimeGap) {
        require(address(_pLockAddress) == address(0), "Time Gap Change: Principal Lock is already deployed");
        _timeGap = newTimeGap;
    }

    /**
        @dev
        When Bob refunds the Principal Sum, this function is called by Principal Lock
        This sets _refunded to true, to prevent Bob from refunding his Principal Sum
        This sets _accessible to false, to allow Alice to withdraw Bob's Griefing Sum
    */
    function setRefund() public {
        require(address(_pLockAddress) == msg.sender, "Principal Lock Refund Setting: Unauthorized Access");
        _refunded = true;
        _accessible = false;
    }

    function getUnlockTime() external view returns(uint256) {
        return _unlockTime;
    }

    function getPrincipalLock() external view returns(address) {
        return _pLockAddress;
    }
}