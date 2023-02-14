import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { describeClaimOrderAction } from '../describe/claimOrder';
import { Account } from '@frugal-wizard/contract-test-helper';

export function createClaimOrderAction({
    orderType,
    price,
    orderId,
    maxAmount = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideOrderId = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideOrderId?: boolean;
}): OrderbookAction {

    return {
        description: describeClaimOrderAction({
            orderType,
            price,
            orderId,
            maxAmount,
            account: Account.MAIN,
            hideOrderType,
            hidePrice,
            hideAmount,
            hideOrderId,
            hideAccount: true,
        }),

        async execute(ctx) {
            const { addressBook, orderbook, } = ctx;
            const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
            await orderbook.claimOrder(orderType, price, orderId, maxAmount, { from });
        },

        apply(orders) {
            return orders.claim(orderType, price, orderId, maxAmount);
        }
    };
}
