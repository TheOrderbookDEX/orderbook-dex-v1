import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { Account } from '@frugalwizard/contract-test-helper';
import { describePlaceOrderAction } from '../describe/placeOrder';
import { MAX_UINT256 } from '@frugalwizard/abi2ts-lib';

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

        async execute({ tradedToken, baseToken, orderbook, [account]: from }) {
            switch (orderType) {
                case OrderType.SELL:
                    await tradedToken.approve(orderbook, MAX_UINT256, { from });
                    await orderbook.placeOrder(orderType, price, amount, { from });
                    await tradedToken.approve(orderbook, 0n, { from });
                    break;

                case OrderType.BUY:
                    await baseToken.approve(orderbook, MAX_UINT256, { from });
                    await orderbook.placeOrder(orderType, price, amount, { from });
                    await baseToken.approve(orderbook, 0n, { from });
                    break;
            }
        },

        apply(orders) {
            return orders.add(account, orderType, price, amount);
        }
    };
}
