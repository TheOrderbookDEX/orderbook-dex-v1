import { ContractError, formatValue, MAX_UINT256, MAX_UINT8, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { createFillAction } from '../action/fill';
import { OrderbookAction } from '../action/orderbook';
import { describeFillScenario } from '../describe/fill';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';

export type FillScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<[ bigint, bigint, bigint ]>;
}> & {
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice: bigint;
    readonly maxPricePoints: number;
    readonly allowance?: bigint;
    readonly takenToken: 'tradedToken' | 'baseToken';
    readonly givenToken: 'tradedToken' | 'baseToken';
    readonly takenAmount: bigint;
    readonly givenAmount: bigint;
    readonly collectedFee: bigint;
    readonly totalFilled: bigint;
    readonly filledAmounts: Map<bigint, bigint>;
    readonly totalPrice: bigint;
    readonly bestPrice: 'askPrice' | 'bidPrice';
    readonly expectedBestPrice: bigint;
    readonly expectedError?: ContractError;
};

export function createFillScenario({
    only,
    description,
    orderType,
    maxAmount,
    maxPrice = orderType == OrderType.SELL ? MAX_UINT256 : 0n,
    maxPricePoints = MAX_UINT8,
    allowance,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
    hideContractSize = false,
    hidePriceTick = false,
    expectedError,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly orderType: OrderType;
    readonly maxAmount: bigint;
    readonly maxPrice?: bigint;
    readonly maxPricePoints?: number;
    readonly allowance?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
    readonly setupActions?: OrderbookAction[];
}): FillScenario {

    const takenToken = orderType == OrderType.SELL ? 'baseToken' : 'tradedToken';
    const givenToken = orderType == OrderType.SELL ? 'tradedToken' : 'baseToken';

    const maxTakenAmount = orderType == OrderType.SELL ?
        (maxPrice == MAX_UINT256 ? MAX_UINT256 : maxAmount * maxPrice) :
        maxAmount * contractSize;

    const bestPrice = orderType == OrderType.SELL ? 'askPrice' : 'bidPrice';

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createFillAction({
        orderType,
        maxAmount,
        maxPrice,
        maxPricePoints,
    }), ordersBefore);

    const filledAmounts: Map<bigint, bigint> = new Map();
    for (const price of ordersBefore.prices(orderType)) {
        const filledAmount =
            ordersBefore.available(orderType, price)
            - ordersAfter.available(orderType, price);
        if (filledAmount) {
            filledAmounts.set(price, filledAmount);
        } else {
            break;
        }
    }

    const totalPrice = [...filledAmounts].reduce((subtotal, [ price, amount ]) => subtotal + price * amount, 0n);

    const totalFilled = ordersBefore.totalAvailable(orderType) - ordersAfter.totalAvailable(orderType);

    const takenAmount = orderType == OrderType.SELL ? totalPrice : totalFilled * contractSize;

    const givenAmount = orderType == OrderType.SELL ? totalFilled * contractSize : totalPrice;

    const collectedFee = givenAmount * fee / parseValue(1);

    const expectedBestPrice = ordersAfter[bestPrice];

    return {
        orderType,
        maxAmount,
        maxPrice,
        maxPricePoints,
        allowance,
        takenToken,
        givenToken,
        takenAmount,
        givenAmount,
        collectedFee,
        totalFilled,
        filledAmounts,
        totalPrice,
        bestPrice,
        expectedBestPrice,
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describeFillScenario({
                orderType,
                maxAmount,
                maxPrice,
                maxPricePoints,
                fee,
                contractSize,
                priceTick,
                hideOrderType,
                hidePrice,
                hideAmount,
                hideContractSize,
                hidePriceTick,
                setupActions,
            }),
            fee,
            contractSize,
            priceTick,

            async setup(ctx) {
                ctx.addContext('orderType', describeOrderType(orderType));
                ctx.addContext('maxAmount', maxAmount);
                if (maxPrice != 0n || maxPrice != MAX_UINT256) ctx.addContext('maxPrice', formatValue(maxPrice));
                if (maxPricePoints != MAX_UINT8) ctx.addContext('maxPricePoints', maxPricePoints);
                if (allowance) ctx.addContext('allowance', formatValue(allowance));

                await executeSetupActions(setupActions, ctx);

                await ctx[takenToken].approve(ctx.orderbook, allowance ?? maxTakenAmount);

                return {
                    ...ctx,
                    execute: () => ctx.orderbook.fill(orderType, maxAmount, maxPrice, maxPricePoints),
                    executeStatic: () => ctx.orderbook.callStatic.fill(orderType, maxAmount, maxPrice, maxPricePoints),
                };
            },
        }),
    };
}
