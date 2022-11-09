// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAddressBook } from "@frugal-wizard/addressbook/contracts/interfaces/IAddressBook.sol";
import { IOrderbook } from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbook.sol";

/**
 * Orderbook exchange for a token pair.
 *
 * While still possible, this contract is not designed to be interacted directly by the user.
 * It will only emit events to help track the amount of contracts available at each price point.
 * It's delegated on the operator smart contract the responsibility of emitting events that
 * help track the user's orders and transaction's results.
 *
 * Observer (view) functions will not throw errors on invalid input or output.
 * It is the consumer's responsibility to make sure both that the input and output are valid.
 * This is so that smart contracts interacting with this one can be gas efficient.
 */
interface IOrderbookV1 is IOrderbook {
    /**
     * Event emitted when an order is placed.
     *
     * @param orderType the order type
     * @param price     the price point
     * @param amount    the amount of contracts
     */
    event Placed(
        OrderType orderType,
        uint256   price,
        uint32    amount
    );

    /**
     * Event emitted when orders are filled.
     *
     * @param orderType the order type
     * @param price     the price point
     * @param amount    the amount of contracts
     */
    event Filled(
        OrderType orderType,
        uint256   price,
        uint64    amount
    );

    /**
     * Event emitted when an order is canceled.
     *
     * @param orderType the order type
     * @param price     the price point
     * @param amount    the amount of contracts canceled
     */
    event Canceled(
        OrderType orderType,
        uint256   price,
        uint32    amount
    );

    /**
     * Error thrown when trying to deploy an orderbook with an invalid address book.
     */
    error InvalidAddressBook();

    /**
     * Error thrown when trying to deploy an orderbook with an invalid token pair.
     */
    error InvalidTokenPair();

    /**
     * Error thrown when trying to deploy an orderbook with an invalid contract size.
     */
    error InvalidContractSize();

    /**
     * Error thrown when trying to deploy an orderbook with an invalid price tick.
     */
    error InvalidPriceTick();

    /**
     * Error thrown when a price is zero or not a multiple of the price tick.
     */
    error InvalidPrice();

    /**
     * Error thrown when a function is called by someone not allowed to.
     */
    error Unauthorized();

    /**
     * Error thrown when trying to place a sell order at bid or below,
     * or a buy order at ask or above.
     */
    error CannotPlaceOrder();

    /**
     * Error thrown when a function is called with an invalid amount.
     */
    error InvalidAmount();

    /**
     * Error thrown when a function is called with an invalid order id.
     */
    error InvalidOrderId();

    /**
     * Error thrown when trying to access an order that's been deleted.
     */
    error OrderDeleted();

    /**
     * Error thrown when trying to cancel an order that has already been fully filled.
     */
    error AlreadyFilled();

    /**
     * Error thrown when the last order id has gone over the provided max last order id.
     */
    error OverMaxLastOrderId();

    /**
     * Error thrown when a function is called with an invalid argument that is not covered by other errors.
     */
    error InvalidArgument();

    /**
     * Place an order.
     *
     * The sender address must be registered in the orderbook's address book.
     *
     * The sender must give an allowance to this contract for the tokens given in exchange.
     *
     * Emits a {Placed} event.
     *
     * @param  orderType the order type
     * @param  price     the price point
     * @param  amount    the amount of contracts
     * @return orderId   the id of the order
     */
    function placeOrder(OrderType orderType, uint256 price, uint32 amount) external returns (uint32 orderId);

    /**
     * Fill orders.
     *
     * The sender must give an allowance to this contract for the token given in exchange.
     *
     * Orders are filled up to a maximum amount of contracts and at the specified or better price.
     * This means prices below or equal to maxPrice for sell orders, and prices above or equal to
     * maxPrice for buy orders.
     *
     * A zero value is allowed for maxPrice, as this can be used to fill buy orders without a price
     * restriction.
     *
     * If there are no orders that satisfy the requirements, the call will not revert but return
     * with a zero result.
     *
     * A Filled event will be emitted for each price point filled.
     *
     * The function will stop if it fills as many price points as indicated by maxPricePoints, to
     * avoid using more gas than allotted.
     *
     * Emits a {Filled} event for each price point filled.
     *
     * @param  orderType      the order type
     * @param  maxAmount      the maximum amount of contracts to fill
     * @param  maxPrice       the maximum price of a contract
     * @param  maxPricePoints the maximum amount of price points to fill
     * @return amountFilled   the amount of contracts filled
     * @return totalPrice     the total price for the contracts filled
     */
    function fill(OrderType orderType, uint64 maxAmount, uint256 maxPrice, uint8 maxPricePoints) external
        returns (uint64 amountFilled, uint256 totalPrice);

    /**
     * Claim an order.
     *
     * This can only be called by the order owner.
     *
     * An order can only be claimed up to the point it's been filled.
     *
     * The order will be deleted after it's filled and claimed completely.
     *
     * @param  orderType     the order type
     * @param  price         the price point
     * @param  orderId       the id of the order
     * @param  maxAmount     the maximum amount of contracts to claim
     * @return amountClaimed the amount of contracts claimed
     */
    function claimOrder(OrderType orderType, uint256 price, uint32 orderId, uint32 maxAmount) external
        returns (uint32 amountClaimed);

    /**
     * Cancel an order.
     *
     * This can only be called by the order owner.
     *
     * An order can only be canceled if it's not been fully filled.
     *
     * The order will be deleted if it's not been filled. Otherwise the order amount will be
     * updated up to where it's filled.
     *
     * Emits a {Canceled} event.
     *
     * @param  orderType        the order type
     * @param  price            the price point
     * @param  orderId          the id of the order
     * @param  maxLastOrderId   the maximum last order id can be before stopping this operation
     * @return amountCanceled   the amount of contracts canceled
     */
    function cancelOrder(OrderType orderType, uint256 price, uint32 orderId, uint32 maxLastOrderId) external
        returns (uint32 amountCanceled);

    /**
     * Transfer an order.
     *
     * This can only be called by the order owner.
     *
     * @param orderType the order type
     * @param price     the price point
     * @param orderId   the id of the order
     * @param newOwner  the maximum last order id can be before stopping this operation
     */
    function transferOrder(OrderType orderType, uint256 price, uint32 orderId, address newOwner) external;

    /**
     * The address book used by the orderbook.
     *
     * @return  the address book used by the orderbook
     */
    function addressBook() external view returns (IAddressBook);

    /**
     * The data of a price point.
     *
     * @param  orderType  the order type
     * @param  price      the price point
     * @return pricePoint the data
     */
    function pricePoint(OrderType orderType, uint256 price) external view returns (PricePoint memory pricePoint);

    /**
     * The data of an order.
     *
     * @param  orderType the order type
     * @param  price     the price point
     * @param  orderId   the id of the order
     * @return order     the data
     */
    function order(OrderType orderType, uint256 price, uint32 orderId) external view returns (Order memory order);
}

/**
 * Order type.
 */
enum OrderType {
    SELL,
    BUY
}

/**
 * Price point data.
 */
struct PricePoint {
    /**
     * The id of the last order placed.
     *
     * This start at zero and increases sequentially.
     */
    uint32 lastOrderId;

    /**
     * The id of the last order placed that has not been deleted.
     */
    uint32 lastActualOrderId;

    /**
     * The total amount of contracts placed.
     */
    uint64 totalPlaced;

    /**
     * The total amount of contracts filled.
     */
    uint64 totalFilled;
}

/**
 * Order data.
 */
struct Order {
    /**
     * The id of the owner of the order.
     */
    uint40 owner;

    /**
     * The amount of contracts placed by the order.
     */
    uint32 amount;

    /**
     * The amount of contracts claimed in the order.
     */
    uint32 claimed;

    /**
     * The total amount of contracts placed before the order.
     */
    uint64 totalPlacedBeforeOrder;

    /**
     * The id of the order placed before this that has not been deleted.
     */
    uint32 prevOrderId;

    /**
     * The id of the next order placed after this that has not been deleted.
     */
    uint32 nextOrderId;
}
