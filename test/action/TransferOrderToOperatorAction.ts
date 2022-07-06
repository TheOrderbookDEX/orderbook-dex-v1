import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { OperatorAction, OperatorActionProperties } from './OperatorAction';
import { OperatorContext } from '../scenario/OperatorScenario';
import { SpecialAccount } from '../state/Order';

export interface TransferOrderToOperatorActionProperties extends OperatorActionProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
}

export class TransferOrderToOperatorAction extends OperatorAction {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;

    constructor({
        orderType,
        price,
        orderId,
        ...rest
    }: TransferOrderToOperatorActionProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
    }

    async execute(ctx: OperatorContext) {
        const { addressBook, orderbook, operator } = ctx;
        const { orderType, price, orderId } = this;
        const from = await addressBook.addr((await orderbook.order(orderType, price, orderId)).owner);
        await orderbook.transferOrder(orderType, price, orderId, operator, { from });
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            state.get(this.orderType, this.price, this.orderId)?.transfer(SpecialAccount.OPERATOR);
            return state;
        } else {
            return state;
        }
    }
}
