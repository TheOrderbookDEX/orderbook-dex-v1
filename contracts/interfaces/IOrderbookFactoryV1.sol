// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAddressBook } from "@frugal-wizard/addressbook/contracts/interfaces/IAddressBook.sol";
import { IOrderbookFactory } from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbookFactory.sol";
import { IOrderbookV1 } from "./IOrderbookV1.sol";

/**
 * Orderbook factory.
 *
 * All orderbooks created by this factory use the same address book.
 */
interface IOrderbookFactoryV1 is IOrderbookFactory {
    /**
     * Error thrown when trying to deploy a factory with an invalid address book.
     */
    error InvalidAddressBook();

    /**
     * Create an orderbook.
     *
     * @param tradedToken  the token being traded
     * @param baseToken    the token given in exchange and used for pricing
     * @param contractSize the size of a contract in tradedToken
     * @param priceTick    the price tick in baseToken
     */
    function createOrderbook(
        IERC20  tradedToken,
        IERC20  baseToken,
        uint256 contractSize,
        uint256 priceTick
    ) external returns (IOrderbookV1);

    /**
     * The address book used by the factory.
     *
     * @return addressBook the address book used by the factory
     */
    function addressBook() external view returns (IAddressBook addressBook);

    /**
     * Total number of orderbooks created by this factory.
     *
     * @return totalCreated total number of orderbooks created by this factory
     */
    function totalCreated() external view returns (uint256 totalCreated);

    /**
     * The orderbook created by this factory at a specific index.
     *
     * Index is not validated by this function, it's the caller responsibility to verify that the index is valid.
     *
     * @param  index     the index to fetch
     * @return orderbook the orderbook created at index provided
     */
    function orderbook(uint256 index) external view returns(IOrderbookV1 orderbook);

    /**
     * The orderbooks created by this factory at a specific index range.
     *
     * Range is not validated by this function, it's the caller responsibility to verify that the range is valid.
     *
     * @param  index      the start index
     * @param  length     the range length
     * @return orderbooks the orderbook created at index provided
     */
    function orderbooks(uint256 index, uint256 length) external view returns(IOrderbookV1[] memory orderbooks);
}
