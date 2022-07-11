import { abiencode, formatValue, MAX_UINT32, Transaction } from '@theorderbookdex/abi2ts-lib';
import { AddContextFunction } from '@theorderbookdex/contract-test-helper';
import { CancelOrderResult } from '@theorderbookdex/orderbook-dex-operator/dist/interfaces/IOperator';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorCancelOrderScenarioProperties extends OperatorScenarioProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
}

export class OperatorCancelOrderScenario extends OperatorScenario<Transaction, CancelOrderResult> {
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
    }: OperatorCancelOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType
        this.price = price;
        this.orderId = orderId;
        this.maxLastOrderId = maxLastOrderId
    }

    addContext(addContext: AddContextFunction) {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        if (this.maxLastOrderId != MAX_UINT32) {
            addContext('maxLastOrderId', String(this.maxLastOrderId));
        }
        super.addContext(addContext);
    }

    async execute({ operator, orderbook }: OperatorContext) {
        return await operator.cancelOrder(
            orderbook,
            abiencode(['uint8', 'uint256', 'uint32'], [this.orderType, this.price, this.orderId]),
            abiencode(['uint32'], [this.maxLastOrderId])
        );
    }

    async executeStatic({ operator, orderbook }: OperatorContext) {
        return await operator.callStatic.cancelOrder(
            orderbook,
            abiencode(['uint8', 'uint256', 'uint32'], [this.orderType, this.price, this.orderId]),
            abiencode(['uint32'], [this.maxLastOrderId])
        );
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
}
