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

        async execute(ctx) {
            const { puppet, orderbook } = ctx;
            await this.approve(ctx);
            await puppet.call(orderbook, this.encode());
        },

        async approve(ctx) {
            const { tradedToken, baseToken, orderbook, puppet } = ctx;
            switch (orderType) {
                case OrderType.SELL: {
                    let allowance = await baseToken.allowance(puppet, orderbook);
                    allowance += maxAmount * maxPrice;
                    if (allowance > MAX_UINT256) allowance = MAX_UINT256;
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, allowance));
                    break;
                }
                case OrderType.BUY: {
                    let allowance = await tradedToken.allowance(puppet, orderbook);
                    allowance += maxAmount * await orderbook.contractSize();
                    if (allowance > MAX_UINT256) allowance = MAX_UINT256;
                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, allowance));
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
