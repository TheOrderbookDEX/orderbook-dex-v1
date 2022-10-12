import { OrderType } from '../state/OrderType';
import { OrderbookAction, OrderbookActionProperties } from './OrderbookAction';
import { Orders } from '../state/Orders';
import { OrderbookContext } from '../scenario/OrderbookScenario';
import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';

export interface CancelOrderActionProperties extends OrderbookActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class CancelOrderAction extends OrderbookAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId: bigint;

    constructor({
        orderType,
        price,
        orderId,
        maxLastOrderId = MAX_UINT32,
        ...rest
    }: CancelOrderActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId;
    }

    async execute(ctx: OrderbookContext) {
        const { addressBook, orderbook } = ctx;
        const { orderType, price, orderId, maxLastOrderId } = this;
        const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
        await orderbook.cancelOrder(orderType, price, orderId, maxLastOrderId, { from });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { orderType, price, orderId } = this;
            return state.cancel(orderType, price, orderId);
        } else {
            return state;
        }
    }
}
