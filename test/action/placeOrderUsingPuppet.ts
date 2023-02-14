import { OrderType } from '../state/OrderType';
import { ReentrancyAction } from './reentrancy';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { describePlaceOrderAction } from '../describe/placeOrder';
import { SpecialAccount } from '../scenario/reentrancy';

export function createPlaceOrderUsingPuppetAction({
    orderType,
    price,
    amount,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideAccount = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideAccount?: boolean;
}): ReentrancyAction {

    return {
        description: describePlaceOrderAction({
            orderType,
            price,
            amount,
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
            const { puppet, tradedToken, baseToken, orderbook } = ctx;
            switch (orderType) {
                case OrderType.SELL:
                    await puppet.call(tradedToken, tradedToken.encode.increaseAllowance(orderbook, amount * await orderbook.contractSize()));
                    break;
                case OrderType.BUY:
                    await puppet.call(baseToken, baseToken.encode.increaseAllowance(orderbook, amount * price));
                    break;
            }
        },

        encode() {
            return OrderbookV1.encode.placeOrder(orderType, price, amount);
        },

        apply(orders) {
            return orders.add(SpecialAccount.PUPPET, orderType, price, amount);
        }
    };
}
