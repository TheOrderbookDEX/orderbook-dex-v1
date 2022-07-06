import { abiencode, formatValue, MAX_UINT8, Transaction } from 'abi2ts-lib';
import { AddContextFunction } from 'contract-test-helper';
import { PlaceSellOrderResult } from 'orderbook-dex-operator/dist/interfaces/IOperator';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorPlaceSellOrderScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints?: number;
}

export class OperatorPlaceSellOrderScenario extends OperatorScenario<Transaction, PlaceSellOrderResult> {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        price,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: OperatorPlaceSellOrderScenarioProperties) {
        super(rest);
        this.maxAmount = maxAmount
        this.price = price;
        this.maxPricePoints = maxPricePoints;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('maxAmount', String(this.maxAmount));
        addContext('price', formatValue(this.price));
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
        super.addContext(addContext);
    }

    async execute({ operator, orderbook }: OperatorContext) {
        return await operator.placeSellOrder(orderbook, this.maxAmount, this.price, abiencode(['uint8'], [this.maxPricePoints]));
    }

    async executeStatic({ operator, orderbook }: OperatorContext) {
        return await operator.callStatic.placeSellOrder(orderbook, this.maxAmount, this.price, abiencode(['uint8'], [this.maxPricePoints]));
    }

    get ordersAfter(): Orders {
        let orders = this.ordersBefore;
        const totalAvailableBefore = orders.totalAvailable(OrderType.BUY);
        orders = new FillAction({ ...this, orderType: OrderType.BUY, maxPrice: this.price }).apply(orders);
        const amount = this.maxAmount - (totalAvailableBefore - orders.totalAvailable(OrderType.BUY));
        try {
            orders = new PlaceOrderAction({ ...this, orderType: OrderType.SELL, amount }).apply(orders);
        } catch {
            // ignore
        }
        return orders;
    }

    get amountSold() {
        return this.ordersBefore.totalAvailable(OrderType.BUY)
            - this.ordersAfter.totalAvailable(OrderType.BUY);
    }

    get amountReceived() {
        let amountReceived = 0n;
        const { ordersBefore, ordersAfter } = this;
        for (const price of ordersBefore.prices(OrderType.BUY)) {
            const amount =
                  ordersBefore.available(OrderType.BUY, price)
                - ordersAfter.available(OrderType.BUY, price);
            if (amount) {
                amountReceived += price * amount;
            } else {
                break;
            }
        }
        return amountReceived;
    }

    get amountPlaced() {
        return this.ordersAfter.available(OrderType.SELL, this.price)
            - this.ordersBefore.available(OrderType.SELL, this.price);
    }

    get orderId() {
        if (this.amountPlaced) {
            const orderId = this.ordersAfter.lastOrderId(OrderType.SELL, this.price);
            return abiencode([ 'uint8', 'uint256', 'uint32' ], [ OrderType.SELL, this.price, orderId ]);
        } else {
            return '0x';
        }
    }

    get actualOrderId() {
        if (this.amountPlaced) {
            return this.ordersAfter.lastOrderId(OrderType.SELL, this.price);
        } else {
            return 0n;
        }
    }
}
