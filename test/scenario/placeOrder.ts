import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { ContractError, formatValue, MAX_UINT256, Transaction } from '@frugalwizard/abi2ts-lib';
import { EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { describePlaceOrderScenario } from '../describe/placeOrder';
import { OrderbookAction } from '../action/orderbook';
import { Orders } from '../state/Orders';
import { applyActions } from '../utils/actions';
import { Token } from '../state/Token';

export type PlaceOrderScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<bigint>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly amount: bigint;
    readonly allowance?: bigint;
    readonly takenToken: Token;
    readonly takenAmount: bigint;
    readonly addsSellPrice: boolean;
    readonly addsBuyPrice: boolean;
    readonly prevPrice: bigint;
    readonly nextPrice: bigint;
    readonly expectedError?: ContractError;
};

export function createPlaceOrderScenario({
    only,
    description,
    orderType,
    price,
    amount,
    allowance = MAX_UINT256,
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
    readonly price: bigint;
    readonly amount: bigint;
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
}): PlaceOrderScenario {

    const takenToken = orderType == OrderType.SELL ? Token.TRADED : Token.BASE;
    const takenAmount = amount * (orderType == OrderType.SELL ? contractSize : price);

    const ordersBefore = applyActions(setupActions, new Orders());

    const addsPrice = ordersBefore.available(orderType, price) == 0n;
    const addsSellPrice = orderType == OrderType.SELL && addsPrice;
    const addsBuyPrice = orderType == OrderType.BUY && addsPrice;

    const prevPrice = orderType == OrderType.SELL ?
        ordersBefore.prevSellPrice(price) :
        ordersBefore.prevBuyPrice(price);

    const nextPrice = orderType == OrderType.SELL ?
        ordersBefore.nextSellPrice(price) :
        ordersBefore.nextBuyPrice(price);

    return {
        orderType,
        price,
        amount,
        allowance,
        takenToken,
        takenAmount,
        addsSellPrice,
        addsBuyPrice,
        prevPrice,
        nextPrice,
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describePlaceOrderScenario({
                orderType,
                price,
                amount,
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
                ctx.addContext('price', formatValue(price));
                ctx.addContext('amount', amount);
                ctx.addContext('allowance', allowance == MAX_UINT256 ? 'MAX' : formatValue(allowance));

                await executeSetupActions(setupActions, ctx);

                await ctx[takenToken].approve(ctx.orderbook, allowance);

                return {
                    ...ctx,
                    execute: () => ctx.orderbook.placeOrder(orderType, price, amount),
                    executeStatic: () => ctx.orderbook.callStatic.placeOrder(orderType, price, amount),
                };
            },
        }),
    };
}
