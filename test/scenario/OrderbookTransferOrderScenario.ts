import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';
import { Account, AddContextFunction } from 'contract-test-helper';
import { describeOrderType, OrderType } from '../state/OrderType';
import { formatValue, Transaction, ZERO_ADDRESS } from 'abi2ts-lib';

export enum TransferTo {
    ZERO_ADDRESS = 'zeroAddress',
}

export type NewOwner = Account | TransferTo;

export interface OrderbookTransferContext extends OrderbookContext {
    readonly zeroAddress: string;
}

export interface OrderbookTransferOrderScenarioProperties extends OrderbookScenarioProperties<OrderbookTransferContext> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly newOwner: NewOwner;
}

export class OrderbookTransferOrderScenario extends OrderbookScenario<OrderbookTransferContext, Transaction, void> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly newOwner: NewOwner;

    constructor({
        orderType,
        price,
        orderId,
        newOwner,
        ...rest
    }: OrderbookTransferOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.newOwner = newOwner;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        addContext('newOwner', this.newOwner);
        super.addContext(addContext);
    }

    async setup() {
        return {
            ...await this._setup(),
            zeroAddress: ZERO_ADDRESS,
        };
    }

    async execute({ orderbook, [this.newOwner]: newOwner }: OrderbookTransferContext) {
        return await orderbook.transferOrder(this.orderType, this.price, this.orderId, newOwner);
    }

    async executeStatic({ orderbook, [this.newOwner]: newOwner }: OrderbookTransferContext) {
        return await orderbook.callStatic.transferOrder(this.orderType, this.price, this.orderId, newOwner);
    }

    get ordersAfter() {
        if (this.newOwner == 'zeroAddress') {
            throw new Error('cannot transfer to zero address');
        }
        const orders = this.ordersBefore;
        orders.get(this.orderType, this.price, this.orderId)?.transfer(this.newOwner);
        return orders;
    }
}
