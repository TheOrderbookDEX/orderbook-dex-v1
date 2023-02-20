import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { MAX_UINT256, MAX_UINT8 } from '@frugalwizard/abi2ts-lib';
import { describeFillAction } from '../describe/fill';
import { Account } from '@frugalwizard/contract-test-helper';

export function createFillAction({
    orderType,
    maxAmount,
    maxPrice = orderType == OrderType.SELL ? MAX_UINT256 : 0n,
    maxPricePoints = MAX_UINT8,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
}: {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
}): OrderbookAction {

    return {
        description: describeFillAction({
            orderType,
            maxAmount,
            maxPrice,
            maxPricePoints,
            account: Account.MAIN,
            hideOrderType,
            hidePrice,
            hideAmount,
            hideAccount: true,
        }),

        async execute({ tradedToken, baseToken, orderbook }) {
            switch (orderType) {
                case OrderType.SELL:
                    await baseToken.approve(orderbook, MAX_UINT256);
                    await orderbook.fill(orderType, maxAmount, maxPrice, maxPricePoints);
                    await baseToken.approve(orderbook, 0n);
                    break;

                case OrderType.BUY:
                    await tradedToken.approve(orderbook, MAX_UINT256);
                    await orderbook.fill(orderType, maxAmount, maxPrice, maxPricePoints);
                    await tradedToken.approve(orderbook, 0n);
                    break;
            }
        },

        apply(orders) {
            return orders.fill(orderType, maxPrice, maxAmount, maxPricePoints);
        }
    };
}
