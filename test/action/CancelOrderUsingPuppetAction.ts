import { OrderType } from '../state/OrderType';
import { OrderbookAction, OrderbookActionProperties } from './OrderbookAction';
import { Orders } from '../state/Orders';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';
import { OrderbookReentrancyContext } from '../scenario/OrderbookReentrancyScenario';

export interface CancelOrderUsingPuppetActionProperties extends OrderbookActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class CancelOrderUsingPuppetAction extends OrderbookAction {
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
    }: CancelOrderUsingPuppetActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId;
    }

    async execute(ctx: OrderbookReentrancyContext) {
        const { puppet, orderbook } = ctx;
        await puppet.call(orderbook, this.encode());
    }

    async approve() {
        return;
    }

    encode(): string {
        return OrderbookV1.encode.cancelOrder(this.orderType, this.price, this.orderId, this.maxLastOrderId);
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
