import { Order, OrderOwner } from './Order';
import { isEqualOrBetterPrice, OrderType } from './OrderType';

type OrderWithId = Order & { orderId: bigint };

export class Orders {
    constructor(readonly orders: readonly Order[] = []) {}

    [Symbol.iterator]() {
        return this.orders[Symbol.iterator]();
    }

    add(owner: OrderOwner, orderType: OrderType, price: bigint, amount: bigint) {
        if (amount == 0n) {
            throw new Error('amount is 0');
        }
        if (orderType == OrderType.SELL && this.bidPrice && price <= this.bidPrice) {
            throw new Error('at or below bid price');
        }
        if (orderType == OrderType.BUY && this.askPrice && price >= this.askPrice) {
            throw new Error('at or above ask price');
        }
        return new Orders([
            ...this.orders,
            new Order({ owner, orderType, price, amount }),
        ]);
    }

    get(orderType: OrderType, price: bigint, orderId: bigint) {
        let orderIdCursor = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            orderIdCursor++;
            if (orderIdCursor == orderId) return order;
        }
    }

    has(orderType: OrderType, price: bigint, orderId: bigint) {
        return this.get(orderType, price, orderId) !== undefined;
    }

    fill(orderType: OrderType, maxPrice: bigint, maxAmount: bigint, maxPricePoints: number): Orders {
        if (maxAmount <= 0n) return this;
        if (maxPricePoints <= 0) return this;

        const bestPrice = this.bestPrice(orderType);

        if (!bestPrice) return this;
        if (!isEqualOrBetterPrice(orderType, bestPrice, maxPrice)) return this;

        let remaining = maxAmount;

        return new Orders(this.orders.map(order => {
            if (!remaining) return order;
            if (order.orderType != orderType) return order;
            if (order.price != bestPrice) return order;
            if (!order.available) return order;
            if (remaining > order.available) {
                const newOrder = order.fill(order.available);
                remaining -= order.available;
                return newOrder;
            } else {
                const newOrder = order.fill(remaining);
                remaining = 0n;
                return newOrder;
            }
        })).fill(orderType, maxPrice, remaining, maxPricePoints-1);
    }

    claim(orderType: OrderType, price: bigint, orderId: bigint, maxAmount: bigint) {
        const order = this.get(orderType, price, orderId);
        if (!order) throw new Error('claiming non existing order');
        return new Orders(this.orders.map(o => o == order ? o.claim(maxAmount) : o));
    }

    cancel(orderType: OrderType, price: bigint, orderId: bigint) {
        const order = this.get(orderType, price, orderId);
        if (!order) throw new Error('canceling non existing order');
        return new Orders(this.orders.map(o => o == order ? o.cancel() : o));
    }

    transfer(orderType: OrderType, price: bigint, orderId: bigint, newOwner: string) {
        const order = this.get(orderType, price, orderId);
        if (!order) throw new Error('transfering non existing order');
        return new Orders(this.orders.map(o => o == order ? o.transfer(newOwner) : o));
    }

    get tradedTokenBalance() {
        let tradedTokenBalance = 0n;
        for (const order of this.orders) {
            switch (order.orderType) {
                case OrderType.SELL:
                    tradedTokenBalance += order.available;
                    break;
                case OrderType.BUY:
                    tradedTokenBalance += order.unclaimed;
                    break;
            }
        }
        return tradedTokenBalance;
    }

    get baseTokenBalance() {
        let baseTokenBalance = 0n;
        for (const order of this.orders) {
            switch (order.orderType) {
                case OrderType.SELL:
                    baseTokenBalance += order.unclaimed * order.price;
                    break;
                case OrderType.BUY:
                    baseTokenBalance += order.available * order.price;
                    break;
            }
        }
        return baseTokenBalance;
    }

    totalPlacedBeforeOrder(orderType: OrderType, price: bigint, orderId: bigint) {
        let orderIdCursor = 0n;
        let totalPlacedBeforeOrder = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            orderIdCursor++;
            if (orderIdCursor >= orderId) break;
            totalPlacedBeforeOrder += order.amount;
        }
        return totalPlacedBeforeOrder;
    }

    prevOrderId(orderType: OrderType, price: bigint, orderId: bigint) {
        let orderIdCursor = 0n;
        let prevOrderId = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            orderIdCursor++;
            if (orderIdCursor == orderId) return prevOrderId;
            if (order.deleted) continue;
            prevOrderId = orderIdCursor;
        }
        return 0n;
    }

    nextOrderId(orderType: OrderType, price: bigint, orderId: bigint) {
        let orderIdCursor = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            orderIdCursor++;
            if (orderIdCursor <= orderId) continue;
            if (order.deleted) continue;
            return orderIdCursor;
        }
        return 0n;
    }

    lastOrderId(orderType: OrderType, price: bigint) {
        let lastOrderId = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            lastOrderId++;
        }
        return lastOrderId;
    }

    lastActualOrderId(orderType: OrderType, price: bigint) {
        let lastActualOrderId = 0n;
        let lastOrderId = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            lastOrderId++;
            if (order.deleted) continue;
            lastActualOrderId = lastOrderId;
        }
        return lastActualOrderId;
    }

    totalPlaced(orderType: OrderType, price: bigint) {
        let totalPlaced = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            totalPlaced += order.amount;
        }
        return totalPlaced;
    }

    totalFilled(orderType: OrderType, price: bigint) {
        let totalFilled = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            totalFilled += order.filled;
        }
        return totalFilled;
    }

    available(orderType: OrderType, price: bigint) {
        let available = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            if (order.price != price) continue;
            available += order.available;
        }
        return available;
    }

    totalAvailable(orderType: OrderType) {
        let totalAvailable = 0n;
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            totalAvailable += order.available;
        }
        return totalAvailable;
    }

    prices(orderType: OrderType) {
        switch (orderType) {
            case OrderType.SELL:
                return this.sellPrices;
            case OrderType.BUY:
                return this.buyPrices;
        }
    }

    get sellPrices() {
        const sellPrices: bigint[] = [];
        for (const order of this.orders) {
            if (order.orderType != OrderType.SELL) continue;
            if (order.deleted) continue;
            if (!order.available) continue;
            if (sellPrices.includes(order.price)) continue;
            sellPrices.push(order.price);
        }
        sellPrices.sort((a, b) => Number(a - b));
        return sellPrices;
    }

    get buyPrices() {
        const buyPrices: bigint[] = [];
        for (const order of this.orders) {
            if (order.orderType != OrderType.BUY) continue;
            if (order.deleted) continue;
            if (!order.available) continue;
            if (buyPrices.includes(order.price)) continue;
            buyPrices.push(order.price);
        }
        buyPrices.sort((a, b) => Number(b - a));
        return buyPrices;
    }

    bestPrice(orderType: OrderType) {
        switch (orderType) {
            case OrderType.SELL:
                return this.askPrice;
            case OrderType.BUY:
                return this.bidPrice;
        }
    }

    get askPrice() {
        return this.sellPrices[0] || 0n;
    }

    get bidPrice() {
        return this.buyPrices[0] || 0n;
    }

    prevPrice(orderType: OrderType, price: bigint) {
        switch (orderType) {
            case OrderType.SELL:
                return this.prevSellPrice(price);
            case OrderType.BUY:
                return this.prevBuyPrice(price);
        }
    }

    nextPrice(orderType: OrderType, price: bigint) {
        switch (orderType) {
            case OrderType.SELL:
                return this.nextSellPrice(price);
            case OrderType.BUY:
                return this.nextBuyPrice(price);
        }
    }

    prevSellPrice(target: bigint) {
        return this.sellPrices.filter(price => price < target).pop() || 0n;
    }

    nextSellPrice(target: bigint) {
        return this.sellPrices.find(price => price > target) || 0n;
    }

    prevBuyPrice(target: bigint) {
        return this.buyPrices.filter(price => price > target).pop() || 0n;
    }

    nextBuyPrice(target: bigint) {
        return this.buyPrices.find(price => price < target) || 0n;
    }

    all(orderType: OrderType): OrderWithId[] {
        const orders: OrderWithId[] = [];
        const orderIdCursors: Map<bigint, bigint> = new Map();
        for (const order of this.orders) {
            if (order.orderType != orderType) continue;
            const { price } = order;
            const orderId = orderIdCursors.get(price) || 1n;
            orderIdCursors.set(price, orderId + 1n);
            orders.push(new Proxy(order, {
                get(obj, prop: keyof OrderWithId) {
                    return prop == 'orderId' ? orderId : obj[prop];
                },
            }) as OrderWithId);
        }
        return orders;
    }

    cancelable(orderType: OrderType) {
        return this.all(orderType).filter(({ cancelable }) => cancelable);
    }

    claimable(orderType: OrderType) {
        return this.all(orderType).filter(({ claimable }) => claimable);
    }

    deleted(orderType: OrderType) {
        return this.all(orderType).filter(({ deleted }) => deleted);
    }
}
