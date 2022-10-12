import { OrderType } from '../state/OrderType';
import { OrderbookAction, OrderbookActionProperties } from './OrderbookAction';
import { Orders } from '../state/Orders';
import { OrderbookContext } from '../scenario/OrderbookScenario';
import { MAX_UINT32 } from '@frugal-wizard/abi2ts-lib';

export interface ClaimOrderActionProperties extends OrderbookActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
}

export class ClaimOrderAction extends OrderbookAction {
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
    }: ClaimOrderActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxAmount = maxAmount;
    }

    async execute(ctx: OrderbookContext) {
        const { addressBook, orderbook, } = ctx;
        const { orderType, price, orderId, maxAmount } = this;
        const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
        await orderbook.claimOrder(orderType, price, orderId, maxAmount, { from });
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
