// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IAddressBook } from "@frugalwizard/addressbook/contracts/interfaces/IAddressBook.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IOrderbookV1 } from "./interfaces/IOrderbookV1.sol";
import { IOrderbookFactoryV1 } from "./interfaces/IOrderbookFactoryV1.sol";
import { OrderbookV1 } from "./OrderbookV1.sol";
import { IOrderbookDEXTeamTreasury }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbookDEXTeamTreasury.sol";

/**
 * Orderbook factory.
 *
 * All orderbooks created by this factory use the same address book.
 */
contract OrderbookFactoryV1 is IOrderbookFactoryV1 {
    /**
     * The Orderbook DEX Team Treasury.
     */
    IOrderbookDEXTeamTreasury private immutable _treasury;

    /**
     * The address book used by the factory.
     */
    IAddressBook private immutable _addressBook;

    /**
     * Total number of orderbooks created by this factory.
     */
    uint256 private _totalCreated;

    /**
     * Orderbooks by index.
     */
    mapping(uint256 => IOrderbookV1) _orderbooks;

    /**
     * Constructor.
     *
     * @param treasury_    the Orderbook DEX Team Treasury
     * @param addressBook_ the address book used by the factory
     */
    constructor(
        IOrderbookDEXTeamTreasury treasury_,
        IAddressBook              addressBook_
    ) {
        if (address(addressBook_) == address(0)) {
            revert InvalidAddressBook();
        }
        _treasury = treasury_;
        _addressBook = addressBook_;
    }

    function createOrderbook(
        IERC20  tradedToken,
        IERC20  baseToken,
        uint256 contractSize,
        uint256 priceTick
    ) external returns (IOrderbookV1) {
        IOrderbookV1 orderbook_ = new OrderbookV1(
            _treasury, _addressBook, tradedToken, baseToken, contractSize, priceTick
        );
        _orderbooks[_totalCreated] = orderbook_;
        _totalCreated++;
        emit OrderbookCreated(
            10000, address(orderbook_), address(tradedToken), address(baseToken), contractSize, priceTick
        );
        return orderbook_;
    }

    function addressBook() external view returns (IAddressBook) {
        return _addressBook;
    }

    function totalCreated() external view returns (uint256) {
        return _totalCreated;
    }

    function orderbook(uint256 index) external view returns(IOrderbookV1) {
        return _orderbooks[index];
    }

    function orderbooks(uint256 index, uint256 length) external view returns(IOrderbookV1[] memory) {
        IOrderbookV1[] memory orderbooks_ = new IOrderbookV1[](length);
        for (uint256 i = 0; i < length; i++) {
            orderbooks_[i] = _orderbooks[index + i];
        }
        return orderbooks_;
    }

    function treasury() external view returns (IOrderbookDEXTeamTreasury) {
        return _treasury;
    }
}
