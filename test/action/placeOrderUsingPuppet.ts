import { OrderType } from '../state/OrderType';
import { ReentrancyAction } from './reentrancy';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { describePlaceOrderAction } from '../describe/placeOrder';
import { SpecialAccount } from '../scenario/reentrancy';
import { MAX_UINT256 } from '@frugalwizard/abi2ts-lib';

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

        async execute({ puppet, tradedToken, baseToken, orderbook }) {
            switch (orderType) {
                case OrderType.SELL:
                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, MAX_UINT256));
                    await puppet.call(orderbook, OrderbookV1.encode.placeOrder(orderType, price, amount));
                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, 0n));
                    break;

                case OrderType.BUY:
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, MAX_UINT256));
                    await puppet.call(orderbook, OrderbookV1.encode.placeOrder(orderType, price, amount));
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, 0n));
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
