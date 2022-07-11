import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { ReentrancyAction, ReentrancyActionProperties } from './ReentrancyAction';
import { OrderbookReentrancyContext } from '../scenario/OrderbookReentrancyScenario';
import { MAX_UINT32 } from '@theorderbookdex/abi2ts-lib';

export interface ClaimOrderUsingPuppetActionProperties extends ReentrancyActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
}

export class ClaimOrderUsingPuppetAction extends ReentrancyAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;

    constructor({
        orderType,
        price,
        orderId,
        maxAmount = MAX_UINT32,
        ...rest
    }: ClaimOrderUsingPuppetActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxAmount = maxAmount;
    }

    async execute(ctx: OrderbookReentrancyContext) {
        const { puppet, orderbook } = ctx;
        await puppet.call(orderbook, this.encode());
    }

    async approve() {
        return;
    }

    encode(): string {
        const { orderType, price, orderId, maxAmount } = this;
        return OrderbookV1.encode.claimOrder(orderType, price, orderId, maxAmount);
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { orderType, price, orderId, maxAmount } = this;
            return state.claim(orderType, price, orderId, maxAmount);
        } else {
            return state;
        }
    }
}
