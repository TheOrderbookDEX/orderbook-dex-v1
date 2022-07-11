import { OrderType } from '../state/OrderType';
import { Orders } from '../state/Orders';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { MAX_UINT256, MAX_UINT8 } from '@theorderbookdex/abi2ts-lib';
import { ReentrancyAction, ReentrancyActionProperties } from './ReentrancyAction';
import { OrderbookReentrancyContext } from '../scenario/OrderbookReentrancyScenario';

export interface FillUsingPuppetActionProperties extends ReentrancyActionProperties {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
}

export class FillUsingPuppetAction extends ReentrancyAction {
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
    }: FillUsingPuppetActionProperties) {
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

    async execute(ctx: OrderbookReentrancyContext) {
        const { puppet, orderbook } = ctx;
        await this.approve(ctx);
        await puppet.call(orderbook, this.encode());
    }

    async approve(ctx: OrderbookReentrancyContext) {
        const { tradedToken, baseToken, orderbook, puppet } = ctx;
        const { orderType, maxPrice, maxAmount } = this;
        switch (orderType) {
            case OrderType.SELL: {
                let allowance = await baseToken.allowance(puppet, orderbook);
                allowance += maxAmount * maxPrice;
                if (allowance > MAX_UINT256) allowance = MAX_UINT256;
                await puppet.call(baseToken, baseToken.encode.approve(orderbook, allowance));
                break;
            }
            case OrderType.BUY: {
                let allowance = await tradedToken.allowance(puppet, orderbook);
                allowance += maxAmount * await orderbook.contractSize();
                if (allowance > MAX_UINT256) allowance = MAX_UINT256;
                await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, allowance));
                break;
            }
        }
    }

    encode(): string {
        return OrderbookV1.encode.fill(this.orderType, this.maxAmount, this.maxPrice, this.maxPricePoints);
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
