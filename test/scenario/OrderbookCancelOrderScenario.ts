import { formatValue, MAX_UINT32, Transaction } from '@theorderbookdex/abi2ts-lib';
import { AddContextFunction } from '@theorderbookdex/contract-test-helper';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';

export interface OrderbookCancelOrderScenarioProperties extends OrderbookScenarioProperties<OrderbookContext> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class OrderbookCancelOrderScenario extends OrderbookScenario<OrderbookContext, Transaction, bigint> {
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
    }: OrderbookCancelOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        if (this.maxLastOrderId != MAX_UINT32) {
            addContext('maxLastOrderId', String(this.maxLastOrderId));
        }
        super.addContext(addContext);
    }

    async setup() {
        return await this._setup();
    }

    async execute({ orderbook }: OrderbookContext) {
        return await orderbook.cancelOrder(this.orderType, this.price, this.orderId, this.maxLastOrderId);
    }

    async executeStatic({ orderbook }: OrderbookContext) {
        return await orderbook.callStatic.cancelOrder(this.orderType, this.price, this.orderId, this.maxLastOrderId);
    }

    get ordersAfter() {
        return new CancelOrderAction(this).apply(this.ordersBefore);
    }

    get amountCanceled() {
        const order = this.ordersBefore.get(this.orderType, this.price, this.orderId);
        return order?.available ?? 0n;
    }

    get givenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'tradedToken';
            case OrderType.BUY:
                return 'baseToken';
        }
    }

    get givenAmount() {
        const { amountCanceled } = this;
        switch (this.orderType) {
            case OrderType.SELL:
                return amountCanceled * this.contractSize;
            case OrderType.BUY:
                return amountCanceled * this.price;
        }
    }

    get deletesOrder() {
        const order = this.ordersAfter.get(this.orderType, this.price, this.orderId);
        return order?.deleted;
    }

    get removesPrice() {
        const orders = this.ordersAfter;
        return !orders.available(this.orderType, this.price);
    }

    get removesSellPrice() {
        return this.orderType == OrderType.SELL && this.removesPrice;
    }

    get removesBuyPrice() {
        return this.orderType == OrderType.BUY && this.removesPrice;
    }

    get prevPrice() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.ordersBefore.prevSellPrice(this.price);
            case OrderType.BUY:
                return this.ordersBefore.prevBuyPrice(this.price);
        }
    }

    get nextPrice() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.ordersBefore.nextSellPrice(this.price);
            case OrderType.BUY:
                return this.ordersBefore.nextBuyPrice(this.price);
        }
    }

    get prevOrderId() {
        return this.ordersBefore.prevOrderId(this.orderType, this.price, this.orderId);
    }

    get nextOrderId() {
        return this.ordersBefore.nextOrderId(this.orderType, this.price, this.orderId);
    }

    get updatesLastActualOrderId() {
        return this.orderId == this.ordersBefore.lastActualOrderId(this.orderType, this.price);
    }
}
