// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.15;

import { IAddressBook } from "@frugal-wizard/addressbook/contracts/interfaces/IAddressBook.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IOrderbookV1 } from "./interfaces/IOrderbookV1.sol";
import { IOrderbookFactoryV1 } from "./interfaces/IOrderbookFactoryV1.sol";
import { OrderbookV1 } from "./OrderbookV1.sol";

/**
 * Orderbook factory.
 *
 * All orderbooks created by this factory use the same address book.
 */
contract OrderbookFactoryV1 is IOrderbookFactoryV1 {
    /**
     * The address book used by the factory.
     */
    IAddressBook private immutable _addressBook;

    /**
     * Block number when orderbook was created.
     */
    mapping(address => uint256) private _blockNumber;

    /**
     * Constructor.
     *
     * @param addressBook_ the address book used by the factory
     */
    constructor(IAddressBook addressBook_) {
        _addressBook = addressBook_;
    }

    function createOrderbook(
        IERC20  tradedToken,
        IERC20  baseToken,
        uint256 contractSize,
        uint256 priceTick
    ) external returns (IOrderbookV1) {
        IOrderbookV1 orderbook = new OrderbookV1(_addressBook, tradedToken, baseToken, contractSize, priceTick);
        _blockNumber[address(orderbook)] = block.number;
        emit OrderbookCreated(orderbook, tradedToken, baseToken, contractSize, priceTick);
        return orderbook;
    }

    function addressBook() external view returns (IAddressBook) {
        return _addressBook;
    }

    function blockNumber(address orderbook) external view returns (uint256) {
        return _blockNumber[orderbook];
    }
}
