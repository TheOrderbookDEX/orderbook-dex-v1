import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { describeOrderType, OrderType } from '../state/OrderType';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { formatValue, MAX_UINT32, Transaction } from '@frugal-wizard/abi2ts-lib';

export interface OrderbookClaimOrderScenarioProperties extends OrderbookScenarioProperties<OrderbookContext> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount?: bigint;
}

export class OrderbookClaimOrderScenario extends OrderbookScenario<OrderbookContext, Transaction, bigint> {
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
    }: OrderbookClaimOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType;
        this.price = price;
        this.orderId = orderId;
        this.maxAmount = maxAmount;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        if (this.maxAmount != MAX_UINT32) {
            addContext('maxAmount', String(this.maxAmount));
        }
        super.addContext(addContext);
    }

    async setup() {
        return await this._setup();
    }

    async execute({ orderbook }: OrderbookContext) {
        return await orderbook.claimOrder(this.orderType, this.price, this.orderId, this.maxAmount);
    }

    async executeStatic({ orderbook }: OrderbookContext) {
        return await orderbook.callStatic.claimOrder(this.orderType, this.price, this.orderId, this.maxAmount);
    }

    get ordersAfter() {
        return new ClaimOrderAction(this).apply(this.ordersBefore);
    }

    get amountClaimed() {
        return (this.ordersAfter.get(this.orderType, this.price, this.orderId)?.claimed ?? 0n)
            - (this.ordersBefore.get(this.orderType, this.price, this.orderId)?.claimed ?? 0n);
    }

    get givenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'baseToken';
            case OrderType.BUY:
                return 'tradedToken';
        }
    }

    get givenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.amountClaimed * this.price;
            case OrderType.BUY:
                return this.amountClaimed * this.contractSize;
        }
    }

    get deletesOrder() {
        return this.ordersAfter.get(this.orderType, this.price, this.orderId)?.deleted ?? false;
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
