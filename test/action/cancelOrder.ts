import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { MAX_UINT32 } from '@frugalwizard/abi2ts-lib';
import { describeCancelOrderAction } from '../describe/cancelOrder';
import { Account } from '@frugalwizard/contract-test-helper';

export function createCancelOrderAction({
    orderType,
    price,
    orderId,
    maxLastOrderId = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
}: {
    orderType: OrderType;
    price: bigint;
    orderId: bigint;
    maxLastOrderId?: bigint;
    hideOrderType?: boolean;
    hidePrice?: boolean;
    hideOrderId?: boolean;
}): OrderbookAction {

    return {
        description: describeCancelOrderAction({
            orderType,
            price,
            orderId,
            account: Account.MAIN,
            hideOrderType,
            hidePrice,
            hideOrderId,
            hideAccount: true,
        }),

        async execute({ addressBook, orderbook }) {
            const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
            await orderbook.cancelOrder(orderType, price, orderId, maxLastOrderId, { from });
        },

        apply(orders) {
            return orders.cancel(orderType, price, orderId);
        }
    };
}
