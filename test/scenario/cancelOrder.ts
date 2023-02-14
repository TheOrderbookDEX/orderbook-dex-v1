import { ContractError, formatValue, MAX_UINT32, Transaction } from '@frugal-wizard/abi2ts-lib';
import { EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { createCancelOrderAction } from '../action/cancelOrder';
import { OrderbookAction } from '../action/orderbook';
import { describeCancelOrderScenario } from '../describe/cancelOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions, applyActionThatMightFail } from '../utils/actions';
import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';

export type CancelOrderScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<bigint>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId: bigint;
    readonly givenToken: 'tradedToken' | 'baseToken';
    readonly givenAmount: bigint;
    readonly amountCanceled: bigint;
    readonly deletesOrder: boolean;
    readonly prevOrderId: bigint;
    readonly nextOrderId: bigint;
    readonly updatesLastActualOrderId: boolean;
    readonly removesSellPrice: boolean;
    readonly removesBuyPrice: boolean;
    readonly prevPrice: bigint;
    readonly nextPrice: bigint;
    readonly expectedError?: ContractError;
};

export function createCancelOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    maxLastOrderId = MAX_UINT32,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideOrderType = false,
    hidePrice = false,
    hideOrderId = false,
    hideContractSize = false,
    hidePriceTick = false,
    expectedError,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxLastOrderId?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
    readonly setupActions?: OrderbookAction[];
}): CancelOrderScenario {

    const givenToken = orderType == OrderType.SELL ? 'tradedToken' : 'baseToken';

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createCancelOrderAction({
        orderType,
        price,
        orderId,
        maxLastOrderId,
    }), ordersBefore);

    const amountCanceled = ordersBefore.get(orderType, price, orderId)?.available ?? 0n;

    const givenAmount = orderType == OrderType.SELL ?
        amountCanceled * contractSize :
        amountCanceled * price;

    const deletesOrder = ordersAfter.get(orderType, price, orderId)?.deleted ?? false;

    const prevOrderId = ordersBefore.prevOrderId(orderType, price, orderId);

    const nextOrderId = ordersBefore.nextOrderId(orderType, price, orderId);

    const updatesLastActualOrderId = orderId == ordersBefore.lastActualOrderId(orderType, price);

    const removesPrice = !ordersAfter.available(orderType, price);
    const removesSellPrice = orderType == OrderType.SELL && removesPrice;
    const removesBuyPrice = orderType == OrderType.BUY && removesPrice;

    const prevPrice = orderType == OrderType.SELL ?
        ordersBefore.prevSellPrice(price) :
        ordersBefore.prevBuyPrice(price);

    const nextPrice = orderType == OrderType.SELL ?
        ordersBefore.nextSellPrice(price) :
        ordersBefore.nextBuyPrice(price);

    return {
        orderType,
        price,
        orderId,
        maxLastOrderId,
        givenToken,
        givenAmount,
        amountCanceled,
        deletesOrder,
        prevOrderId,
        nextOrderId,
        updatesLastActualOrderId,
        removesSellPrice,
        removesBuyPrice,
        prevPrice,
        nextPrice,
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describeCancelOrderScenario({
                orderType,
                price,
                orderId,
                fee,
                contractSize,
                priceTick,
                hideOrderType,
                hidePrice,
                hideOrderId,
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
                ctx.addContext('orderId', orderId);
                ctx.addContext('maxLastOrderId', maxLastOrderId == MAX_UINT32 ? 'MAX' : maxLastOrderId);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.orderbook.cancelOrder(orderType, price, orderId, maxLastOrderId),
                    executeStatic: () => ctx.orderbook.callStatic.cancelOrder(orderType, price, orderId, maxLastOrderId),
                };
            },
        }),
    };
}
