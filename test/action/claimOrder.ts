import { OrderType } from '../state/OrderType';
import { OrderbookAction } from './orderbook';
import { MAX_UINT32 } from '@frugalwizard/abi2ts-lib';
import { describeClaimOrderAction } from '../describe/claimOrder';
import { Account } from '@frugalwizard/contract-test-helper';

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

        async execute({ addressBook, orderbook, }) {
            const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
            await orderbook.claimOrder(orderType, price, orderId, maxAmount, { from });
        },

        apply(orders) {
            return orders.claim(orderType, price, orderId, maxAmount);
        }
    };
}
