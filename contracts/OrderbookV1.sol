// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.17;

import { IOrderbookV1, OrderType, PricePoint, Order } from "./interfaces/IOrderbookV1.sol";
import { IAddressBook } from "@frugal-wizard/addressbook/contracts/interfaces/IAddressBook.sol";
import { AddressBookUtil } from "@frugal-wizard/addressbook/contracts/utils/AddressBookUtil.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IOrderbookDEXTeamTreasury }
    from "@theorderbookdex/orderbook-dex/contracts/interfaces/IOrderbookDEXTeamTreasury.sol";
import { OrderbookDEXTeamTreasuryUtil }
    from "@theorderbookdex/orderbook-dex/contracts/utils/OrderbookDEXTeamTreasuryUtil.sol";

contract OrderbookV1 is IOrderbookV1 {
    using OrderbookDEXTeamTreasuryUtil for IOrderbookDEXTeamTreasury;
    using AddressBookUtil for IAddressBook;
    using SafeERC20 for IERC20;

    uint32 constant VERSION = 10000;

    /**
     * The Orderbook DEX Team Treasury.
     */
    IOrderbookDEXTeamTreasury private immutable _treasury;

    /**
     * The address book used by the orderbook.
     */
    IAddressBook private immutable _addressBook;

    /**
     * The token being traded.
     */
    IERC20 private immutable _tradedToken;

    /**
     * The token given in exchange and used for pricing.
     */
    IERC20 private immutable _baseToken;

    /**
     * The size of a contract in tradedToken.
     */
    uint256 private immutable _contractSize;

    /**
     * The price tick in baseToken.
     */
    uint256 private immutable _priceTick;

    /**
     * The data of price points.
     */
    mapping(OrderType => mapping(uint256 => PricePoint)) private _pricePoints;

    /**
     * The data of orders.
     */
    mapping(OrderType => mapping(uint256 => mapping(uint32 => Order))) internal _orders;

    /**
     * The ask price in baseToken.
     */
    uint256 private _askPrice;

    /**
     * The bid price in baseToken.
     */
    uint256 private _bidPrice;

    /**
     * The next available sell price point.
     */
    mapping(uint256 => uint256) private _nextSellPrice;

    /**
     * The next available buy price point.
     */
    mapping(uint256 => uint256) private _nextBuyPrice;

    /**
     * The total collected fees in traded token that have not yet been claimed.
     */
    uint256 private _collectedTradedToken;

    /**
     * The total collected fees in base token that have not yet been claimed.
     */
    uint256 private _collectedBaseToken;

    /**
     * Constructor.
     *
     * @param treasury_     the Orderbook DEX Team Treasury
     * @param addressBook_  the address book used by the orderbook
     * @param tradedToken_  the token being traded
     * @param baseToken_    the token given in exchange and used for pricing
     * @param contractSize_ the size of a contract in tradedToken
     * @param priceTick_    the price tick in baseToken
     */
    constructor(
        IOrderbookDEXTeamTreasury treasury_,
        IAddressBook              addressBook_,
        IERC20                    tradedToken_,
        IERC20                    baseToken_,
        uint256                   contractSize_,
        uint256                   priceTick_
    ) {
        if (address(addressBook_) == address(0)) {
            revert InvalidAddressBook();
        }
        if (address(tradedToken_) == address(0)) {
            revert InvalidTokenPair();
        }
        if (address(baseToken_) == address(0)) {
            revert InvalidTokenPair();
        }
        if (tradedToken_ == baseToken_) {
            revert InvalidTokenPair();
        }
        if (contractSize_ == 0) {
            revert InvalidContractSize();
        }
        if (priceTick_ == 0) {
            revert InvalidPriceTick();
        }
        _treasury       = treasury_;
        _addressBook    = addressBook_;
        _tradedToken    = tradedToken_;
        _baseToken      = baseToken_;
        _contractSize   = contractSize_;
        _priceTick      = priceTick_;
    }

    function placeOrder(OrderType orderType, uint256 price, uint32 amount) external returns (uint32) {
        if (orderType == OrderType.SELL) {
            uint256 bidPrice_ = _bidPrice;
            if (bidPrice_ != 0 && price <= bidPrice_) {
                revert CannotPlaceOrder();
            }
        } else {
            uint256 askPrice_ = _askPrice;
            if (askPrice_ != 0 && price >= askPrice_) {
                revert CannotPlaceOrder();
            }
        }

        if (amount == 0) {
            revert InvalidAmount();
        }

        if (price == 0 || price % _priceTick != 0) {
            revert InvalidPrice();
        }

        PricePoint memory pricePoint_ = _pricePoints[orderType][price];

        if (pricePoint_.totalPlaced == pricePoint_.totalFilled) {
            addPrice(orderType, price);
        }

        pricePoint_.lastOrderId++;

        _orders[orderType][price][pricePoint_.lastOrderId] = Order(
            _addressBook.safeId(msg.sender),
            amount,
            0,
            pricePoint_.totalPlaced,
            pricePoint_.lastActualOrderId,
            0
        );

        _orders[orderType][price][pricePoint_.lastActualOrderId].nextOrderId = pricePoint_.lastOrderId;

        pricePoint_.lastActualOrderId = pricePoint_.lastOrderId;
        pricePoint_.totalPlaced += amount;

        _pricePoints[orderType][price] = pricePoint_;

        if (orderType == OrderType.SELL) {
            _tradedToken.safeTransferFrom(msg.sender, address(this), amount * _contractSize);
        } else {
            _baseToken.safeTransferFrom(msg.sender, address(this), amount * price);
        }

        emit Placed(orderType, price, amount);

        return pricePoint_.lastOrderId;
    }

    function fill(OrderType orderType, uint64 maxAmount, uint256 maxPrice, uint8 maxPricePoints) external
        returns (uint64 amountFilled, uint256 totalPrice, uint256 fee)
    {
        uint256 price;

        if (orderType == OrderType.SELL) {
            price = _askPrice;
            if (price == 0 || price > maxPrice) {
                return (0, 0, 0);
            }
        } else {
            price = _bidPrice;
            if (price == 0 || price < maxPrice) {
                return (0, 0, 0);
            }
        }

        if (maxAmount == 0) {
            revert InvalidAmount();
        }

        if (maxPricePoints == 0) {
            revert InvalidArgument();
        }

        uint64 amountLeft = maxAmount;

        uint8 pricePointsFilled = 0;

        while (pricePointsFilled < maxPricePoints) {
            PricePoint memory pricePoint_ = _pricePoints[orderType][price];

            uint64 amount = pricePoint_.totalPlaced - pricePoint_.totalFilled;

            if (amount > amountLeft) {
                amount = amountLeft;
            }

            amountLeft -= amount;
            amountFilled += amount;
            totalPrice += amount * price;

            pricePoint_.totalFilled += amount;

            _pricePoints[orderType][price] = pricePoint_;

            emit Filled(orderType, price, amount);

            if (pricePoint_.totalPlaced == pricePoint_.totalFilled) {
                removePrice(orderType, price);
                if (amountLeft > 0) {
                    if (orderType == OrderType.SELL) {
                        price = _askPrice;
                        if (price == 0 || maxPrice < price) {
                            break;
                        }
                    } else {
                        price = _bidPrice;
                        if (price == 0 || maxPrice > price) {
                            break;
                        }
                    }
                } else {
                    break;
                }
            } else {
                break;
            }

            pricePointsFilled++;
        }

        if (orderType == OrderType.SELL) {
            uint256 totalTradedToken = amountFilled * _contractSize;

            fee = totalTradedToken * _treasury.safeFee(VERSION) / 1 ether;
            _collectedTradedToken += fee;

            _baseToken.safeTransferFrom(msg.sender, address(this), totalPrice);
            _tradedToken.safeTransfer(msg.sender, totalTradedToken - fee);

        } else {
            fee = totalPrice * _treasury.safeFee(VERSION) / 1 ether;
            _collectedBaseToken += fee;

            _tradedToken.safeTransferFrom(msg.sender, address(this), amountFilled * _contractSize);
            _baseToken.safeTransfer(msg.sender, totalPrice - fee);
        }
    }

    function claimOrder(OrderType orderType, uint256 price, uint32 orderId, uint32 maxAmount) external
        returns (uint32 amountClaimed, uint256 fee)
    {
        if (maxAmount == 0) {
            revert InvalidAmount();
        }

        if (price == 0 || price % _priceTick != 0) {
            revert InvalidPrice();
        }

        PricePoint memory pricePoint_ = _pricePoints[orderType][price];

        if (orderId == 0 || orderId > pricePoint_.lastOrderId) {
            revert InvalidOrderId();
        }

        Order memory order_ = _orders[orderType][price][orderId];

        if (order_.owner == 0) {
            revert OrderDeleted();
        }

        if (_addressBook.addr(order_.owner) != msg.sender) {
            revert Unauthorized();
        }

        if (pricePoint_.totalFilled < order_.totalPlacedBeforeOrder) {
            return (0, 0);
        }

        uint64 amountFilled = pricePoint_.totalFilled - order_.totalPlacedBeforeOrder;

        if (amountFilled > order_.amount) {
            amountClaimed = order_.amount;
        } else {
            amountClaimed = uint32(amountFilled);
        }

        amountClaimed -= order_.claimed;

        if (amountClaimed > maxAmount) {
            amountClaimed = maxAmount;
        }

        if (amountClaimed > 0) {
            order_.claimed += amountClaimed;

            if (order_.claimed == order_.amount) {
                deleteOrder(orderType, price, orderId, pricePoint_, order_, true);
            } else {
                _orders[orderType][price][orderId] = order_;
            }

            if (orderType == OrderType.SELL) {
                uint256 totalClaimed = amountClaimed * price;

                fee = totalClaimed * _treasury.safeFee(VERSION) / 1 ether;
                _collectedBaseToken += fee;

                _baseToken.safeTransfer(msg.sender, totalClaimed - fee);

            } else {
                uint256 totalClaimed = amountClaimed * _contractSize;

                fee = totalClaimed * _treasury.safeFee(VERSION) / 1 ether;
                _collectedTradedToken += fee;

                _tradedToken.safeTransfer(msg.sender, totalClaimed - fee);
            }
        }
    }

    function cancelOrder(OrderType orderType, uint256 price, uint32 orderId, uint32 maxLastOrderId) external
        returns (uint32 amountCanceled)
    {
        PricePoint memory pricePoint_ = _pricePoints[orderType][price];

        if (pricePoint_.lastOrderId > maxLastOrderId) {
            revert OverMaxLastOrderId();
        }

        if (price == 0 || price % _priceTick != 0) {
            revert InvalidPrice();
        }

        if (orderId == 0 || orderId > pricePoint_.lastOrderId) {
            revert InvalidOrderId();
        }

        Order memory order_ = _orders[orderType][price][orderId];

        if (order_.owner == 0) {
            revert OrderDeleted();
        }

        if (_addressBook.addr(order_.owner) != msg.sender) {
            revert Unauthorized();
        }

        amountCanceled = order_.amount;

        if (pricePoint_.totalFilled > order_.totalPlacedBeforeOrder) {
            uint64 filledAmount = pricePoint_.totalFilled - order_.totalPlacedBeforeOrder;

            if (filledAmount >= order_.amount) {
                revert AlreadyFilled();
            }

            order_.amount = uint32(filledAmount);
            amountCanceled -= uint32(filledAmount);

            if (order_.amount == order_.claimed) {
                deleteOrder(orderType, price, orderId, pricePoint_, order_, false);
            } else {
                _orders[orderType][price][orderId] = order_;
            }
        } else {
            deleteOrder(orderType, price, orderId, pricePoint_, order_, false);
        }

        uint32 orderIdCursor = pricePoint_.lastActualOrderId;
        while (orderIdCursor > orderId) {
            Order memory orderCursor = _orders[orderType][price][orderIdCursor];
            if (orderCursor.owner == 0) continue;
            orderCursor.totalPlacedBeforeOrder -= amountCanceled;
            _orders[orderType][price][orderIdCursor] = orderCursor;
            orderIdCursor = orderCursor.prevOrderId;
        }

        pricePoint_.totalPlaced -= amountCanceled;

        _pricePoints[orderType][price] = pricePoint_;

        if (pricePoint_.totalPlaced == pricePoint_.totalFilled) {
            removePrice(orderType, price);
        }

        if (orderType == OrderType.SELL) {
            _tradedToken.safeTransfer(msg.sender, amountCanceled * _contractSize);
        } else {
            _baseToken.safeTransfer(msg.sender, amountCanceled * price);
        }

        emit Canceled(orderType, price, amountCanceled);
    }

    function transferOrder(OrderType orderType, uint256 price, uint32 orderId, address newOwner) external {
        if (price == 0 || price % _priceTick != 0) {
            revert InvalidPrice();
        }

        if (orderId == 0 || orderId > _pricePoints[orderType][price].lastOrderId) {
            revert InvalidOrderId();
        }

        Order memory order_ = _orders[orderType][price][orderId];

        if (order_.owner == 0) {
            revert OrderDeleted();
        }

        IAddressBook addressBook_ = _addressBook;

        if (addressBook_.addr(order_.owner) != msg.sender) {
            revert Unauthorized();
        }

        order_.owner = addressBook_.safeId(newOwner);

        _orders[orderType][price][orderId] = order_;
    }

    function deleteOrder(
        OrderType orderType, uint256 price, uint32 orderId,
        PricePoint memory pricePoint_, Order memory order_,
        bool updatePricePoint
    ) internal {
        if (pricePoint_.lastActualOrderId == orderId) {
            pricePoint_.lastActualOrderId = order_.prevOrderId;
            if (updatePricePoint) {
                _pricePoints[orderType][price] = pricePoint_;
            }
        }
        if (order_.prevOrderId != 0) {
            _orders[orderType][price][order_.prevOrderId].nextOrderId = order_.nextOrderId;
        }
        if (order_.nextOrderId != 0) {
            _orders[orderType][price][order_.nextOrderId].prevOrderId = order_.prevOrderId;
        }
        delete _orders[orderType][price][orderId];
    }

    function addPrice(OrderType orderType, uint256 price) internal {
        if (orderType == OrderType.SELL) {
            addSellPrice(price);
        } else {
            addBuyPrice(price);
        }
    }

    function removePrice(OrderType orderType, uint256 price) internal {
        if (orderType == OrderType.SELL) {
            removeSellPrice(price);
        } else {
            removeBuyPrice(price);
        }
    }

    function addSellPrice(uint256 price) internal {
        uint256 askPrice_ = _askPrice;

        if (askPrice_ == 0) {
            _askPrice = price;

        } else {
            if (askPrice_ > price) {
                _nextSellPrice[price] = askPrice_;
                _askPrice = price;

            } else {
                uint256 priceCursor = askPrice_;
                uint256 nextPrice = _nextSellPrice[priceCursor];
                while (nextPrice != 0 && price > nextPrice) {
                    priceCursor = nextPrice;
                    nextPrice = _nextSellPrice[priceCursor];
                }
                _nextSellPrice[priceCursor] = price;
                if (nextPrice != 0) {
                    _nextSellPrice[price] = nextPrice;
                }
            }
        }
    }

    function removeSellPrice(uint256 price) internal {
        uint256 askPrice_ = _askPrice;

        if (askPrice_ == price) {
            _askPrice = _nextSellPrice[price];
            delete _nextSellPrice[price];

        } else {
            uint256 priceCursor = askPrice_;
            uint256 nextPrice = _nextSellPrice[priceCursor];
            while (nextPrice != price) {
                priceCursor = nextPrice;
                nextPrice = _nextSellPrice[priceCursor];
            }
            _nextSellPrice[priceCursor] = _nextSellPrice[price];
            delete _nextSellPrice[price];
        }
    }

    function addBuyPrice(uint256 price) internal {
        uint256 bidPrice_ = _bidPrice;

        if (bidPrice_ == 0) {
            _bidPrice = price;

        } else {
            if (bidPrice_ < price) {
                _nextBuyPrice[price] = bidPrice_;
                _bidPrice = price;

            } else {
                uint256 priceCursor = bidPrice_;
                uint256 nextPrice = _nextBuyPrice[priceCursor];
                while (nextPrice != 0 && price < nextPrice) {
                    priceCursor = nextPrice;
                    nextPrice = _nextBuyPrice[priceCursor];
                }
                _nextBuyPrice[priceCursor] = price;
                if (nextPrice != 0) {
                    _nextBuyPrice[price] = nextPrice;
                }
            }
        }
    }

    function removeBuyPrice(uint256 price) internal {
        uint256 bidPrice_ = _bidPrice;

        if (bidPrice_ == price) {
            _bidPrice = _nextBuyPrice[price];
            delete _nextBuyPrice[price];

        } else {
            uint256 priceCursor = bidPrice_;
            uint256 nextPrice = _nextBuyPrice[priceCursor];
            while (nextPrice != price) {
                priceCursor = nextPrice;
                nextPrice = _nextBuyPrice[priceCursor];
            }
            _nextBuyPrice[priceCursor] = _nextBuyPrice[price];
            delete _nextBuyPrice[price];
        }
    }

    function claimFees() external {
        // TODO claimFees
    }

    function addressBook() external view returns (IAddressBook) {
        return _addressBook;
    }

    function tradedToken() external view returns (address) {
        return address(_tradedToken);
    }

    function baseToken() external view returns (address) {
        return address(_baseToken);
    }

    function contractSize() external view returns (uint256) {
        return _contractSize;
    }

    function priceTick() external view returns (uint256) {
        return _priceTick;
    }

    function askPrice() external view returns (uint256) {
        return _askPrice;
    }

    function bidPrice() external view returns (uint256) {
        return _bidPrice;
    }

    function nextSellPrice(uint256 price) external view returns (uint256) {
        return _nextSellPrice[price];
    }

    function nextBuyPrice(uint256 price) external view returns (uint256) {
        return _nextBuyPrice[price];
    }

    function pricePoint(OrderType orderType, uint256 price) external view returns (PricePoint memory) {
        return _pricePoints[orderType][price];
    }

    function order(OrderType orderType, uint256 price, uint32 orderId) external view returns (Order memory) {
        return _orders[orderType][price][orderId];
    }

    function version() external pure returns (uint32) {
        return VERSION;
    }

    function treasury() external view returns (IOrderbookDEXTeamTreasury) {
        return _treasury;
    }

    function collectedFees() external view returns (uint256 collectedTradedToken, uint256 collectedBaseToken) {
        collectedTradedToken = _collectedTradedToken;
        collectedBaseToken = _collectedBaseToken;
    }
}
