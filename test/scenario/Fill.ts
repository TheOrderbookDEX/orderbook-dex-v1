import { formatValue, MAX_UINT256, MAX_UINT8, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { AddContextFunction } from '@frugal-wizard/contract-test-helper';
import { FillAction } from '../action/Fill';
import { describeOrderType, OrderType } from '../state/OrderType';
import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './Orderbook';

export interface FillScenarioProperties extends OrderbookScenarioProperties<OrderbookContext> {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly allowance?: bigint;
}

export class FillScenario extends OrderbookScenario<OrderbookContext, Transaction, [bigint, bigint, bigint]> {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;
    readonly allowance?: bigint;

    constructor({
        orderType,
        maxAmount,
        maxPrice,
        maxPricePoints = MAX_UINT8,
        allowance,
        ...rest
    }: FillScenarioProperties) {
        super(rest);
        this.orderType = orderType;
        this.maxAmount = maxAmount;
        if (maxPrice === undefined) {
            switch (orderType) {
                case OrderType.SELL:
                    this.maxPrice = MAX_UINT256;
                    break;
                case OrderType.BUY:
                    this.maxPrice = 0n;
                    break;
            }
        } else {
            this.maxPrice = maxPrice;
        }
        this.maxPricePoints = maxPricePoints;
        this.allowance = allowance;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('orderType', describeOrderType(this.orderType));
        addContext('maxAmount', String(this.maxAmount));
        if (this.maxPrice != 0n || this.maxPrice != MAX_UINT256) {
            addContext('maxPrice', formatValue(this.maxPrice));
        }
        if (this.maxPricePoints != MAX_UINT8) {
            addContext('maxPricePoints', String(this.maxPricePoints));
        }
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
        await takenToken.approve(orderbook, this.allowance || this.maxTakenAmount);
    }

    async execute({ orderbook }: OrderbookContext) {
        return await orderbook.fill(this.orderType, this.maxAmount, this.maxPrice, this.maxPricePoints);
    }

    async executeStatic({ orderbook }: OrderbookContext) {
        return await orderbook.callStatic.fill(this.orderType, this.maxAmount, this.maxPrice, this.maxPricePoints);
    }

    get ordersAfter() {
        return new FillAction(this).apply(this.ordersBefore);
    }

    get takenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'baseToken';
            case OrderType.BUY:
                return 'tradedToken';
        }
    }

    get maxTakenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.maxPrice == MAX_UINT256 ? MAX_UINT256 : this.maxAmount * this.maxPrice;
            case OrderType.BUY:
                return this.maxAmount * this.contractSize;
        }
    }

    get takenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.totalPrice;
            case OrderType.BUY:
                return this.totalFilled * this.contractSize;
        }
    }

    get givenToken() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'tradedToken';
            case OrderType.BUY:
                return 'baseToken';
        }
    }

    get maxGivenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.maxAmount * this.contractSize;
            case OrderType.BUY:
                return this.maxAmount * this.maxPrice;
        }
    }

    get givenAmount() {
        switch (this.orderType) {
            case OrderType.SELL:
                return this.totalFilled * this.contractSize;
            case OrderType.BUY:
                return this.totalPrice;
        }
    }

    get collectedFee() {
        return this.givenAmount * this.fee / parseValue(1);
    }

    get totalFilled() {
        const { orderType } = this;
        return this.ordersBefore.totalAvailable(orderType)
            - this.ordersAfter.totalAvailable(orderType);
    }

    get filledAmounts() {
        const { ordersBefore, ordersAfter } = this;
        const filledAmounts: Map<bigint, bigint> = new Map();
        for (const price of ordersBefore.prices(this.orderType)) {
            const filledAmount =
                  ordersBefore.available(this.orderType, price)
                - ordersAfter.available(this.orderType, price);
            if (filledAmount) {
                filledAmounts.set(price, filledAmount);
            } else {
                break;
            }
        }
        return filledAmounts;
    }

    get totalPrice() {
        let totalPrice = 0n;
        for (const [ price, amount ] of this.filledAmounts.entries()) {
            totalPrice += price * amount;
        }
        return totalPrice;
    }

    get bestPrice() {
        switch (this.orderType) {
            case OrderType.SELL:
                return 'askPrice';
            case OrderType.BUY:
                return 'bidPrice';
        }
    }

    get expectedBestPrice() {
        return this.ordersAfter[this.bestPrice];
    }
}
