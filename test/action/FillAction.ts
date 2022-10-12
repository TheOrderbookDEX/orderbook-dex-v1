import { OrderType } from '../state/OrderType';
import { OrderbookAction, OrderbookActionProperties } from './OrderbookAction';
import { Orders } from '../state/Orders';
import { OrderbookContext } from '../scenario/OrderbookScenario';
import { MAX_UINT256, MAX_UINT8 } from '@frugal-wizard/abi2ts-lib';

export interface FillActionProperties extends OrderbookActionProperties {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class FillAction extends OrderbookAction {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;

    constructor({
        orderType,
        maxAmount,
        maxPrice,
        maxPricePoints = MAX_UINT8,
        ...rest
    }: FillActionProperties) {
        if (maxPrice === undefined) {
            switch (orderType) {
                case OrderType.SELL:
                    maxPrice = MAX_UINT256;
                    break;
                case OrderType.BUY:
                    maxPrice = 0n;
                    break;
            }
        }
        super(rest);
        this.orderType = orderType;
        this.maxAmount = maxAmount;
        this.maxPrice = maxPrice;
        this.maxPricePoints = maxPricePoints;
    }

    async execute(ctx: OrderbookContext) {
        const { tradedToken, baseToken, orderbook } = ctx;
        const { orderType, maxPrice, maxAmount, maxPricePoints } = this;
        switch (orderType) {
            case OrderType.SELL:
                await baseToken.approve(orderbook, maxPrice == MAX_UINT256 ? maxPrice : maxAmount * maxPrice);
                break;
            case OrderType.BUY:
                await tradedToken.approve(orderbook, maxAmount * await orderbook.contractSize());
                break;
        }
        await orderbook.fill(orderType, maxAmount, maxPrice, maxPricePoints);
    }

    apply<T>(state: T) {
        if (state instanceof Orders) {
            const { orderType, maxPrice, maxAmount, maxPricePoints } = this;
            return state.fill(orderType, maxPrice, maxAmount, maxPricePoints);
        } else {
            return state;
        }
    }
}
