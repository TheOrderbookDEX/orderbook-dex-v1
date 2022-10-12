import { abiencode, formatValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { Account, AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { TransferOrderResult } from '@theorderbookdex/orderbook-dex-operator/dist/interfaces/IOperator';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorTransferOrderScenarioProperties extends OperatorScenarioProperties {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;
}

export class OperatorTransferOrderScenario extends OperatorScenario<Transaction, TransferOrderResult> {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly recipient: Account;

    constructor({
        orderType,
        price,
        orderId,
        recipient,
        ...rest
    }: OperatorTransferOrderScenarioProperties) {
        super(rest);
        this.orderType = orderType
        this.price = price;
        this.orderId = orderId;
        this.recipient = recipient;
    }

    addContext(addContext: AddContextFunction) {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('price', formatValue(this.price));
        addContext('orderId', String(this.orderId));
        addContext('recipient', this.recipient);
        super.addContext(addContext);
    }

    async execute({ operator, orderbook, [this.recipient]: recipient }: OperatorContext) {
        return await operator.transferOrder(
            orderbook,
            abiencode(['uint8', 'uint256', 'uint32'], [this.orderType, this.price, this.orderId]),
            recipient
        );
    }

    async executeStatic({ operator, orderbook, [this.recipient]: recipient }: OperatorContext) {
        return await operator.callStatic.transferOrder(
            orderbook,
            abiencode(['uint8', 'uint256', 'uint32'], [this.orderType, this.price, this.orderId]),
            recipient
        );
    }

    get ordersAfter(): Orders {
        const orders = this.ordersBefore;
        orders.get(this.orderType, this.price, this.orderId)?.transfer(this.recipient);
        return orders;
    }
}
