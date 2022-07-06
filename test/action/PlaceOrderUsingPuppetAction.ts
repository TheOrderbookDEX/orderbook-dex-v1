import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { OrderbookReentrancyContext } from '../scenario/OrderbookReentrancyScenario';
import { ReentrancyAction, ReentrancyActionProperties } from './ReentrancyAction';
import { SpecialAccount } from '../state/Order';
import { OrderbookV1 } from '../../src/OrderbookV1';

export interface PlaceOrderUsingPuppetActionProperties extends ReentrancyActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
}

export class PlaceOrderUsingPuppetAction extends ReentrancyAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;

    constructor({
        orderType,
        price,
        amount,
        ...rest
    }: PlaceOrderUsingPuppetActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.amount = amount;
    }

    async execute(ctx: OrderbookReentrancyContext) {
        const { puppet, orderbook } = ctx;
        await this.approve(ctx);
        await puppet.call(orderbook, this.encode());
    }

    async approve(ctx: OrderbookReentrancyContext) {
        const { puppet, tradedToken, baseToken, orderbook } = ctx;
        const { orderType, price, amount } = this;
        switch (orderType) {
            case OrderType.SELL:
                await puppet.call(tradedToken, tradedToken.encode.increaseAllowance(orderbook, amount * await orderbook.contractSize()));
                break;
            case OrderType.BUY:
                await puppet.call(baseToken, baseToken.encode.increaseAllowance(orderbook, amount * price));
                break;
        }
    }

    encode() {
        return OrderbookV1.encode.placeOrder(this.orderType, this.price, this.amount);
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            return state.add(SpecialAccount.PUPPET, this.orderType, this.price, this.amount);
        } else {
            return state;
        }
    }
}
