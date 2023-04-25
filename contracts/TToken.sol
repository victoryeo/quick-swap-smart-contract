// SPDX-License-Identifier: MIT
// SettleMint.com

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract TToken is ERC165, ERC20Burnable, Pausable, AccessControl {
  constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _mint(msg.sender, 1000000 * 10 ** decimals());
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, AccessControl) returns (bool) {
    return
      interfaceId == type(IERC20).interfaceId ||
      interfaceId == type(ERC20Burnable).interfaceId ||
      interfaceId == type(Pausable).interfaceId ||
      super.supportsInterface(interfaceId); // ERC165, AccessControl
  }

  function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }

  function burn(uint256 amount) public virtual override {
    _burn(_msgSender(), amount);
  }

  function _beforeTokenTransfer(address from, address to, uint256 amount) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}
