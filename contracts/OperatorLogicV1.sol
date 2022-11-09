// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOrderbookV1, OrderType, Order } from "./interfaces/IOrderbookV1.sol";
import { OrderbookUtilV1 } from "./utils/OrderbookUtilV1.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    BuyAtMarketResult, SellAtMarketResult, PlaceBuyOrderResult, PlaceSellOrderResult, ClaimOrderResult,
    TransferOrderResult, CancelOrderResult
} from "@theorderbookdex/orderbook-dex-operator/contracts/interfaces/IOperatorLogic.sol";

/**
 * Operator logic for V1 orderbooks.
 */
library OperatorLogicV1 {
    using OrderbookUtilV1 for IOrderbookV1;

    event Failed(bytes error);
    event BoughtAtMarket(uint256 amountBought, uint256 amountPaid);
    event SoldAtMarket(uint256 amountSold, uint256 amountReceived);
    event PlacedBuyOrder(uint256 amount, bytes orderId);
    event PlacedSellOrder(uint256 amount, bytes orderId);
    event OrderClaimed(uint256 amount);
    event OrderTransfered();
    event OrderCanceled(uint256 amount);

    function buyAtMarket(address orderbook, uint256 maxAmount, uint256 maxPrice, bytes calldata extraData) external
        returns (BuyAtMarketResult memory result)
    {
        if (maxAmount > type(uint64).max) {
            maxAmount = type(uint64).max;
        }
        (uint8 maxPricePoints) = abi.decode(extraData, (uint8));
        IERC20 baseToken = IOrderbookV1(orderbook).baseToken();
        if (maxPrice == type(uint256).max) {
            baseToken.approve(orderbook, maxPrice);
        } else {
            baseToken.approve(orderbook, maxAmount * maxPrice);
        }
        try IOrderbookV1(orderbook).fill(OrderType.SELL, uint64(maxAmount), maxPrice, maxPricePoints)
            returns (uint64 amountBought, uint256 amountPaid)
        {
            result.amountBought = amountBought;
            result.amountPaid = amountPaid;
            if (amountBought > 0) {
                emit BoughtAtMarket(amountBought, amountPaid);
            }
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
        if (baseToken.allowance(address(this), orderbook) != 0) {
            baseToken.approve(orderbook, 0);
        }
    }

    function sellAtMarket(address orderbook, uint256 maxAmount, uint256 minPrice, bytes calldata extraData) external
        returns (SellAtMarketResult memory result)
    {
        if (maxAmount > type(uint64).max) {
            maxAmount = type(uint64).max;
        }
        (uint8 maxPricePoints) = abi.decode(extraData, (uint8));
        IERC20 tradedToken = IOrderbookV1(orderbook).tradedToken();
        tradedToken.approve(orderbook, maxAmount * IOrderbookV1(orderbook).contractSize());
        try IOrderbookV1(orderbook).fill(OrderType.BUY, uint64(maxAmount), minPrice, maxPricePoints)
            returns (uint64 amountSold, uint256 amountReceived)
        {
            result.amountSold = amountSold;
            result.amountReceived = amountReceived;
            if (amountSold > 0) {
                emit SoldAtMarket(amountSold, amountReceived);
            }
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
        if (tradedToken.allowance(address(this), orderbook) != 0) {
            tradedToken.approve(orderbook, 0);
        }
    }

    function placeBuyOrder(address orderbook, uint256 maxAmount, uint256 price, bytes calldata extraData) external
        returns (PlaceBuyOrderResult memory result)
    {
        if (maxAmount > type(uint32).max) {
            maxAmount = type(uint32).max;
        }
        IERC20 baseToken = IOrderbookV1(orderbook).baseToken();
        baseToken.approve(orderbook, maxAmount * price);
        uint256 askPrice = IOrderbookV1(orderbook).askPrice();
        if (askPrice == 0 || price < askPrice) {
            try IOrderbookV1(orderbook).placeOrder(OrderType.BUY, price, uint32(maxAmount))
                returns (uint32 orderId)
            {
                bytes memory encodedOrderId = abi.encode(OrderType.BUY, price, orderId);
                result.amountPlaced = maxAmount;
                result.orderId = encodedOrderId;
                emit PlacedBuyOrder(maxAmount, encodedOrderId);
            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        } else {
            (uint8 maxPricePoints) = abi.decode(extraData, (uint8));
            try IOrderbookV1(orderbook).fill(OrderType.SELL, uint64(maxAmount), price, maxPricePoints)
                returns (uint64 amountBought, uint256 amountPaid)
            {
                result.amountBought = amountBought;
                result.amountPaid = amountPaid;
                if (amountBought > 0) {
                    emit BoughtAtMarket(amountBought, amountPaid);
                    maxAmount -= amountBought;
                }
                if (maxAmount != 0) {
                    askPrice = IOrderbookV1(orderbook).askPrice();
                    if (askPrice == 0 || price < askPrice) {
                        try IOrderbookV1(orderbook).placeOrder(OrderType.BUY, price, uint32(maxAmount))
                            returns (uint32 orderId)
                        {
                            bytes memory encodedOrderId = abi.encode(OrderType.BUY, price, orderId);
                            result.amountPlaced = maxAmount;
                            result.orderId = encodedOrderId;
                            emit PlacedBuyOrder(maxAmount, encodedOrderId);
                        } catch (bytes memory error) {
                            result.failed = true;
                            result.error = error;
                            emit Failed(error);
                        }
                    }
                }
            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        }
        if (baseToken.allowance(address(this), orderbook) != 0) {
            baseToken.approve(orderbook, 0);
        }
    }

    function placeSellOrder(address orderbook, uint256 maxAmount, uint256 price, bytes calldata extraData) external
        returns (PlaceSellOrderResult memory result)
    {
        if (price == 0) {
            // We do this here because the error won't be caught later
            result.failed = true;
            result.error = abi.encodePacked(IOrderbookV1.InvalidPrice.selector);
            emit Failed(result.error);
            return result;
        }
        if (maxAmount > type(uint32).max) {
            maxAmount = type(uint32).max;
        }
        IERC20 tradedToken = IOrderbookV1(orderbook).tradedToken();
        tradedToken.approve(orderbook, maxAmount * IOrderbookV1(orderbook).contractSize());
        uint256 bidPrice = IOrderbookV1(orderbook).bidPrice();
        if (price > bidPrice) {
            try IOrderbookV1(orderbook).placeOrder(OrderType.SELL, price, uint32(maxAmount))
                returns (uint32 orderId)
            {
                bytes memory encodedOrderId = abi.encode(OrderType.SELL, price, orderId);
                result.amountPlaced = maxAmount;
                result.orderId = encodedOrderId;
                emit PlacedSellOrder(maxAmount, encodedOrderId);
            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        } else {
            (uint8 maxPricePoints) = abi.decode(extraData, (uint8));
            try IOrderbookV1(orderbook).fill(OrderType.BUY, uint64(maxAmount), price, maxPricePoints)
                returns (uint64 amountSold, uint256 amountReceived)
            {
                result.amountSold = amountSold;
                result.amountReceived = amountReceived;
                if (amountSold > 0) {
                    emit SoldAtMarket(amountSold, amountReceived);
                    maxAmount -= amountSold;
                }
                if (maxAmount != 0) {
                    bidPrice = IOrderbookV1(orderbook).bidPrice();
                    if (price > bidPrice) {
                        try IOrderbookV1(orderbook).placeOrder(OrderType.SELL, price, uint32(maxAmount))
                            returns (uint32 orderId)
                        {
                            bytes memory encodedOrderId = abi.encode(OrderType.SELL, price, orderId);
                            result.amountPlaced = maxAmount;
                            result.orderId = encodedOrderId;
                            emit PlacedSellOrder(maxAmount, encodedOrderId);
                        } catch (bytes memory error) {
                            result.failed = true;
                            result.error = error;
                            emit Failed(error);
                        }
                    }
                }
            } catch (bytes memory error) {
                result.failed = true;
                result.error = error;
                emit Failed(error);
            }
        }
        if (tradedToken.allowance(address(this), orderbook) != 0) {
            tradedToken.approve(orderbook, 0);
        }
    }

    function claimOrder(address orderbook, bytes calldata orderId, bytes calldata extraData) external
        returns (ClaimOrderResult memory result)
    {
        (OrderType orderType, uint256 price, uint32 orderId_) = abi.decode(orderId, (OrderType, uint256, uint32));
        (uint32 maxAmount) = abi.decode(extraData, (uint32));
        try IOrderbookV1(orderbook).claimOrder(orderType, price, orderId_, maxAmount)
            returns (uint32 amountClaimed)
        {
            result.amountClaimed = amountClaimed;
            emit OrderClaimed(amountClaimed);
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }

    function transferOrder(address orderbook, bytes calldata orderId, address recipient) external
        returns (TransferOrderResult memory result)
    {
        (OrderType orderType, uint256 price, uint32 orderId_) = abi.decode(orderId, (OrderType, uint256, uint32));
        try IOrderbookV1(orderbook).transferOrder(orderType, price, orderId_, recipient) {
            emit OrderTransfered();
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }

    function cancelOrder(address orderbook, bytes calldata orderId, bytes calldata extraData) external
        returns (CancelOrderResult memory result)
    {
        (OrderType orderType, uint256 price, uint32 orderId_) = abi.decode(orderId, (OrderType, uint256, uint32));
        (uint32 maxLastOrderId) = abi.decode(extraData, (uint32));
        try IOrderbookV1(orderbook).cancelOrder(orderType, price, orderId_, maxLastOrderId)
            returns (uint32 amountCanceled)
        {
            result.amountCanceled = amountCanceled;
            emit OrderCanceled(amountCanceled);
        } catch (bytes memory error) {
            result.failed = true;
            result.error = error;
            emit Failed(error);
        }
    }
}
