import { abiencode, formatValue, MAX_UINT8, Transaction } from '@theorderbookdex/abi2ts-lib';
import { AddContextFunction } from '@theorderbookdex/contract-test-helper';
import { PlaceBuyOrderResult } from '@theorderbookdex/orderbook-dex-operator/dist/interfaces/IOperator';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorPlaceBuyOrderScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints?: number;
}

export class OperatorPlaceBuyOrderScenario extends OperatorScenario<Transaction, PlaceBuyOrderResult> {
    readonly maxAmount: bigint;
    readonly price: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        price,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: OperatorPlaceBuyOrderScenarioProperties) {
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
        return await operator.placeBuyOrder(orderbook, this.maxAmount, this.price, abiencode(['uint8'], [this.maxPricePoints]));
    }

    async executeStatic({ operator, orderbook }: OperatorContext) {
        return await operator.callStatic.placeBuyOrder(orderbook, this.maxAmount, this.price, abiencode(['uint8'], [this.maxPricePoints]));
    }

    get ordersAfter(): Orders {
        let orders = this.ordersBefore;
        const totalAvailableBefore = orders.totalAvailable(OrderType.SELL);
        orders = new FillAction({ ...this, orderType: OrderType.SELL, maxPrice: this.price }).apply(orders);
        const amount = this.maxAmount - (totalAvailableBefore - orders.totalAvailable(OrderType.SELL));
        try {
            orders = new PlaceOrderAction({ ...this, orderType: OrderType.BUY, amount }).apply(orders);
        } catch {
            // ignore
        }
        return orders;
    }

    get amountBought() {
        return this.ordersBefore.totalAvailable(OrderType.SELL)
            - this.ordersAfter.totalAvailable(OrderType.SELL);
    }

    get amountPaid() {
        let amountPaid = 0n;
        const { ordersBefore, ordersAfter } = this;
        for (const price of ordersBefore.prices(OrderType.SELL)) {
            const amount =
                  ordersBefore.available(OrderType.SELL, price)
                - ordersAfter.available(OrderType.SELL, price);
            if (amount) {
                amountPaid += price * amount;
            } else {
                break;
            }
        }
        return amountPaid;
    }

    get amountPlaced() {
        return this.ordersAfter.available(OrderType.BUY, this.price)
            - this.ordersBefore.available(OrderType.BUY, this.price);
    }

    get orderId() {
        if (this.amountPlaced) {
            const orderId = this.ordersAfter.lastOrderId(OrderType.BUY, this.price);
            return abiencode([ 'uint8', 'uint256', 'uint32' ], [ OrderType.BUY, this.price, orderId ]);
        } else {
            return '0x';
        }
    }

    get actualOrderId() {
        if (this.amountPlaced) {
            return this.ordersAfter.lastOrderId(OrderType.BUY, this.price);
        } else {
            return 0n;
        }
    }
}
