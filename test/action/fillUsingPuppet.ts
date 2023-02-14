import { OrderType } from '../state/OrderType';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { MAX_UINT256, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';
import { ReentrancyAction } from './reentrancy';
import { describeFillAction } from '../describe/fill';
import { SpecialAccount } from '../scenario/reentrancy';

export function createFillUsingPuppetAction({
    orderType,
    maxAmount,
    maxPrice = orderType == OrderType.SELL ? MAX_UINT256 : 0n,
    maxPricePoints = MAX_UINT8,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideAccount = false,
}: {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideAccount?: boolean;
}): ReentrancyAction {

    return {
        description: describeFillAction({
            orderType,
            maxAmount,
            maxPrice,
            maxPricePoints,
            account: SpecialAccount.PUPPET,
            hideOrderType,
            hidePrice,
            hideAmount,
            hideAccount,
        }),

        async execute({ tradedToken, baseToken, orderbook, puppet }) {
            switch (orderType) {
                case OrderType.SELL: {
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, MAX_UINT256));
                    await puppet.call(orderbook, OrderbookV1.encode.fill(orderType, maxAmount, maxPrice, maxPricePoints));
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, 0n));
                    break;
                }

                case OrderType.BUY: {
                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, MAX_UINT256));
                    await puppet.call(orderbook, OrderbookV1.encode.fill(orderType, maxAmount, maxPrice, maxPricePoints));
                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, 0n));
                    break;
                }
            }
        },

        encode() {
            return OrderbookV1.encode.fill(orderType, maxAmount, maxPrice, maxPricePoints);
        },

        apply(orders) {
            return orders.fill(orderType, maxPrice, maxAmount, maxPricePoints);
        }
    };
}
