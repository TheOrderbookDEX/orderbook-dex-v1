import { abiencode, formatValue, MAX_UINT256, MAX_UINT8, Transaction } from 'abi2ts-lib';
import { AddContextFunction } from 'contract-test-helper';
import { BuyAtMarketResult } from 'orderbook-dex-operator/dist/interfaces/IOperator';
import { FillAction } from '../action/FillAction';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { OperatorContext, OperatorScenario, OperatorScenarioProperties } from './OperatorScenario';

export interface OperatorBuyAtMarketScenarioProperties extends OperatorScenarioProperties {
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class OperatorBuyAtMarketScenario extends OperatorScenario<Transaction, BuyAtMarketResult> {
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        maxAmount,
        maxPrice = MAX_UINT256,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: OperatorBuyAtMarketScenarioProperties) {
        super(rest);
        this.maxAmount = maxAmount
        this.maxPrice = maxPrice;
        this.maxPricePoints = maxPricePoints;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('maxAmount', String(this.maxAmount));
        if (this.maxPrice != MAX_UINT256) {
            addContext('maxPrice', formatValue(this.maxPrice));
        }
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
        super.addContext(addContext);
    }

    async execute({ operator, orderbook }: OperatorContext) {
        return await operator.buyAtMarket(orderbook, this.maxAmount, this.maxPrice, abiencode(['uint8'], [this.maxPricePoints]));
    }

    async executeStatic({ operator, orderbook }: OperatorContext) {
        return await operator.callStatic.buyAtMarket(orderbook, this.maxAmount, this.maxPrice, abiencode(['uint8'], [this.maxPricePoints]));
    }

    get ordersAfter(): Orders {
        return new FillAction({ ...this, orderType: OrderType.SELL }).apply(this.ordersBefore);
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
}
