import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { describeOrderType, OrderType } from '../state/OrderType';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { formatValue, Transaction } from '@frugal-wizard/abi2ts-lib';

export interface OrderbookPlaceOrderScenarioProperties extends OrderbookScenarioProperties<OrderbookContext> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly allowance?: bigint;
}

export class OrderbookPlaceOrderScenario extends OrderbookScenario<OrderbookContext, Transaction, bigint> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly allowance?: bigint;

    constructor({
        orderType,
        price,
        amount,
        allowance,
        ...rest
    }: OrderbookPlaceOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.amount = amount;
        this.allowance = allowance;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('amount', String(this.amount));
        if (this.allowance) {
            addContext('allowance', formatValue(this.allowance));
        }
        super.addContext(addContext);
    }

    async setup() {
        return await this._setup();
    }

    async afterSetup(ctx: OrderbookContext) {
        await super.afterSetup(ctx);
        const { orderbook, [this.takenToken]: takenToken } = ctx;
        await takenToken.approve(orderbook, this.allowance || this.takenAmount);
    }

    async execute({ orderbook }: OrderbookContext) {
        return await orderbook.placeOrder(this.orderType, this.price, this.amount);
    }

    async executeStatic({ orderbook }: OrderbookContext) {
        return await orderbook.callStatic.placeOrder(this.orderType, this.price, this.amount);
    }

    get ordersAfter() {
        return new PlaceOrderAction(this).apply(this.ordersBefore);
    }

    get takenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'tradedToken';
            case OrderType.BUY:
                return 'baseToken';
        }
    }

    get takenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.amount * this.contractSize;
            case OrderType.BUY:
                return this.amount * this.price;
        }
    }

    get addsPrice() {
        return this.ordersBefore.available(this.orderType, this.price) == 0n;
    }

    get addsSellPrice() {
        return this.orderType == OrderType.SELL && this.addsPrice;
    }

    get addsBuyPrice() {
        return this.orderType == OrderType.BUY && this.addsPrice;
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
}
