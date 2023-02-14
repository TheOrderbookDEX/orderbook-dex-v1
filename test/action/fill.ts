import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { MAX_UINT256, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { describeFillAction } from '../describe/fill';
import { Account } from '@frugal-wizard/contract-test-helper';

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

        async execute(ctx) {
            const { tradedToken, baseToken, orderbook } = ctx;
            switch (orderType) {
                case OrderType.SELL:
                    await baseToken.approve(orderbook, maxPrice == MAX_UINT256 ? maxPrice : maxAmount * maxPrice);
                    break;
                case OrderType.BUY:
                    await tradedToken.approve(orderbook, maxAmount * await orderbook.contractSize());
                    break;
            }
            await orderbook.fill(orderType, maxAmount, maxPrice, maxPricePoints);
        },

        apply(orders) {
            return orders.fill(orderType, maxPrice, maxAmount, maxPricePoints);
        }
    };
}
