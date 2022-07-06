export enum OrderType { SELL, BUY }

export function describeOrderType(orderType: OrderType) {
    switch (orderType) {
        case OrderType.SELL:
            return 'sell';
        case OrderType.BUY:
            return 'buy';
    }
}

export function isEqualOrBetterPrice(orderType: OrderType, price: bigint, comparedTo: bigint) {
    switch (orderType) {
        case OrderType.SELL:
            return price <= comparedTo;
        case OrderType.BUY:
            return price >= comparedTo;
    }
}
