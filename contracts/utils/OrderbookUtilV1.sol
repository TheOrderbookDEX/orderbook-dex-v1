// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IOrderbookV1, OrderType, PricePoint, Order } from "../interfaces/IOrderbookV1.sol";

library OrderbookUtilV1 {
    /**
     * Check if a price point is valid.
     *
     * @param orderbook the orderbook
     * @param price     the price point
     * @return          true if the price point is valid
     */
    function priceValid(IOrderbookV1 orderbook, uint256 price) internal view returns (bool) {
        return price != 0 && price % orderbook.priceTick() == 0;
    }

    /**
     * The id of the last order placed for a price point.
     *
     * This start at zero and increases sequentially.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @return          the id of the last order placed
     */
    function lastOrderId(IOrderbookV1 orderbook, OrderType orderType, uint256 price) internal view returns (uint32) {
        return orderbook.pricePoint(orderType, price).lastOrderId;
    }

    /**
     * The amount of contracts available for a price point.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @return          the amount of contracts available
     */
    function available(IOrderbookV1 orderbook, OrderType orderType, uint256 price) internal view returns (uint64) {
        return available(orderbook.pricePoint(orderType, price));
    }

    /**
     * The amount of contracts available for a price point.
     *
     * @param pricePoint    the price point
     * @return              the amount of contracts available
     */
    function available(PricePoint memory pricePoint) internal pure returns (uint64) {
        return pricePoint.totalPlaced - pricePoint.totalFilled;
    }

    /**
     * Check if an order id is valid.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          true if the order id is valid
     */
    function orderIdValid(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (bool)
    {
        return orderIdValid(orderbook.pricePoint(orderType, price), orderId);
    }

    /**
     * Check if an order id is valid.
     *
     * @param pricePoint    the price point
     * @param orderId       the id of the order
     * @return              true if the order id is valid
     */
    function orderIdValid(PricePoint memory pricePoint, uint32 orderId) internal pure returns (bool) {
        return orderId != 0 && orderId <= pricePoint.lastOrderId;
    }

    /**
     * Check if an order exists.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          true if the order exists
     */
    function orderExists(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (bool)
    {
        return orderExists(orderbook.order(orderType, price, orderId));
    }

    /**
     * Check if an order exists.
     *
     * @param order     the order
     * @return          true if the order exists
     */
    function orderExists(Order memory order) internal pure returns (bool) {
        return order.owner != 0;
    }

    /**
     * The owner of an order.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          the owner of the order
     */
    function orderOwner(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (address)
    {
        return orderOwner(orderbook, orderbook.order(orderType, price, orderId));
    }

    /**
     * The owner of an order.
     *
     * @param orderbook the orderbook
     * @param order     the order
     * @return          the owner of the order
     */
    function orderOwner(IOrderbookV1 orderbook, Order memory order) internal view returns (address) {
        if (order.owner == 0) return address(0);
        return orderbook.addressBook().addr(order.owner);
    }

    /**
     * The amount of contracts placed by an order.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          the amount of contracts placed
     */
    function orderAmount(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (uint32)
    {
        return orderbook.order(orderType, price, orderId).amount;
    }

    /**
     * The amount of contracts filled in an order.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          the amount of contracts filled
     */
    function orderFilled(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (uint32)
    {
        return orderFilled(orderbook.pricePoint(orderType, price), orderbook.order(orderType, price, orderId));
    }

    /**
     * The amount of contracts filled in an order.
     *
     * @param pricePoint    the price point
     * @param order         the order
     * @return              the amount of contracts filled
     */
    function orderFilled(PricePoint memory pricePoint, Order memory order) internal pure returns (uint32) {
        if (pricePoint.totalFilled > order.totalPlacedBeforeOrder) {
            uint64 filledAmount = pricePoint.totalFilled - order.totalPlacedBeforeOrder;
            if (filledAmount > order.amount) {
                return order.amount;
            } else {
                return uint32(filledAmount);
            }
        } else {
            return 0;
        }
    }

    /**
     * The amount of contracts claimed in an order.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          the amount of contracts claimed
     */
    function orderClaimed(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (uint32)
    {
        return orderbook.order(orderType, price, orderId).claimed;
    }

    /**
     * The amount of contracts unclaimed in an order.
     *
     * @param orderbook the orderbook
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @return          the amount of contracts unclaimed
     */
    function orderUnclaimed(IOrderbookV1 orderbook, OrderType orderType, uint256 price, uint32 orderId)
        internal view returns (uint32)
    {
        return orderUnclaimed(orderbook.pricePoint(orderType, price), orderbook.order(orderType, price, orderId));
    }

    /**
     * The amount of contracts unclaimed in an order.
     *
     * @param pricePoint    the price point
     * @param order         the order
     * @return              the amount of contracts unclaimed
     */
    function orderUnclaimed(PricePoint memory pricePoint, Order memory order) internal pure returns (uint32) {
        return orderFilled(pricePoint, order) - order.claimed;
    }
}
