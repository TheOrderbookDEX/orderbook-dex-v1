import { OrderType } from '../state/OrderType';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { SpecialAccount } from '../scenario/reentrancy';
import { ReentrancyAction } from './reentrancy';
import { describeCancelOrderAction } from '../describe/cancelOrder';

export function createCancelOrderUsingPuppetAction({
    orderType,
    price,
    orderId,
    maxLastOrderId = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
    hideAccount = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAccount?: boolean;
}): ReentrancyAction {

    return {
        description: describeCancelOrderAction({
            orderType,
            price,
            orderId,
            account: SpecialAccount.PUPPET,
            hideOrderType,
            hidePrice,
            hideOrderId,
            hideAccount,
        }),

        async execute(ctx) {
            const { puppet, orderbook } = ctx;
            await puppet.call(orderbook, this.encode());
        },

        async approve() {
            return;
        },

        encode() {
            return OrderbookV1.encode.cancelOrder(orderType, price, orderId, maxLastOrderId);
        },

        apply(orders) {
            return orders.cancel(orderType, price, orderId);
        }
    };
}
