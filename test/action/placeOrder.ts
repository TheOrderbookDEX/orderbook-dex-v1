import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { Account } from '@frugal-wizard/contract-test-helper';
import { describePlaceOrderAction } from '../describe/placeOrder';

export function createPlaceOrderAction({
    account = Account.MAIN,
    orderType,
    price,
    amount,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideAccount = false,
}: {
    readonly account?: Account;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideAccount?: boolean;
}): OrderbookAction {

    return {
        description: describePlaceOrderAction({
            orderType,
            price,
            amount,
            account,
            hideOrderType,
            hidePrice,
            hideAmount,
            hideAccount,
        }),

        async execute(ctx) {
            const { tradedToken, baseToken, orderbook, [account]: from } = ctx;
            switch (orderType) {
                case OrderType.SELL:
                    await tradedToken.approve(orderbook, amount * await orderbook.contractSize(), { from });
                    break;
                case OrderType.BUY:
                    await baseToken.approve(orderbook, amount * price, { from });
                    break;
            }
            await orderbook.placeOrder(orderType, price, amount, { from });
        },

        apply(orders) {
            return orders.add(account, orderType, price, amount);
        }
    };
}
