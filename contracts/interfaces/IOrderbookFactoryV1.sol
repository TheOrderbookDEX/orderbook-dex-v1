// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAddressBook } from "@theorderbookdex/addressbook/contracts/interfaces/IAddressBook.sol";
import { IOrderbookV1 } from "./IOrderbookV1.sol";

/**
 * Orderbook factory.
 *
 * All orderbooks created by this factory use the same address book.
 */
interface IOrderbookFactoryV1 {
    /**
     * Event emitted when an orderbook is created.
     *
     * @param orderbook     the orderbook created
     * @param tradedToken   the token being traded
     * @param baseToken     the token given in exchange and used for pricing
     * @param contractSize  the size of a contract in tradedToken
     * @param priceTick     the price tick in baseToken
     */
    event OrderbookCreated(
        IOrderbookV1    orderbook,
        IERC20 indexed  tradedToken,
        IERC20 indexed  baseToken,
        uint256         contractSize,
        uint256         priceTick
    );

    /**
     * Create an orderbook.
     *
     * @param tradedToken   the token being traded
     * @param baseToken     the token given in exchange and used for pricing
     * @param contractSize  the size of a contract in tradedToken
     * @param priceTick     the price tick in baseToken
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
     * @return the address book used by the factory
     */
    function addressBook() external view returns (IAddressBook);

    /**
     * Block number when an orderbook was created.
     *
     * Returns 0 if the orderbook was not created by this factory.
     *
     * @param orderbook the address of the orderbook
     * @return block number when the orderbook was created
     */
    function blockNumber(address orderbook) external view returns (uint256);
}
