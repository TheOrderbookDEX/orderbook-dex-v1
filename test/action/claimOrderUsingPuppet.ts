import { OrderType } from '../state/OrderType';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { ReentrancyAction } from './reentrancy';
import { MAX_UINT32 } from '@frugalwizard/abi2ts-lib';
import { describeClaimOrderAction } from '../describe/claimOrder';
import { SpecialAccount } from '../scenario/reentrancy';

export function createClaimOrderUsingPuppetAction({
    orderType,
    price,
    orderId,
    maxAmount = MAX_UINT32,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideOrderId = false,
    hideAccount = false,
}: {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideAccount?: boolean;
}): ReentrancyAction {

    return {
        description: describeClaimOrderAction({
            orderType,
            price,
            orderId,
            maxAmount,
            account: SpecialAccount.PUPPET,
            hideOrderType,
            hidePrice,
            hideAmount,
            hideOrderId,
            hideAccount,
        }),

        async execute({ puppet, orderbook }) {
            await puppet.call(orderbook, OrderbookV1.encode.claimOrder(orderType, price, orderId, maxAmount));
        },

        encode() {
            return OrderbookV1.encode.claimOrder(orderType, price, orderId, maxAmount);
        },

        apply(orders) {
            return orders.claim(orderType, price, orderId, maxAmount);
        }
    };
}
