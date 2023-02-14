import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';
import { describeOrderType, OrderType } from '../state/OrderType';
import { createClaimOrderAction } from '../action/claimOrder';
import { ContractError, formatValue, MAX_UINT32, parseValue, Transaction } from '@frugal-wizard/abi2ts-lib';
import { EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { OrderbookAction } from '../action/orderbook';
import { describeClaimOrderScenario } from '../describe/claimOrder';
import { Orders } from '../state/Orders';
import { applyActions, applyActionThatMightFail } from '../utils/actions';

export type ClaimOrderScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<[ bigint, bigint ]>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly maxAmount: bigint;
    readonly givenToken: 'tradedToken' | 'baseToken';
    readonly givenAmount: bigint;
    readonly collectedFee: bigint;
    readonly amountClaimed: bigint;
    readonly deletesOrder: boolean;
    readonly prevOrderId: bigint;
    readonly nextOrderId: bigint;
    readonly updatesLastActualOrderId: boolean;
    readonly expectedError?: ContractError;
};

export function createClaimOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    maxAmount = MAX_UINT32,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideOrderType = false,
    hidePrice = false,
    hideAmount = false,
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
    readonly maxAmount?: bigint;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideOrderType?: boolean;
    readonly hidePrice?: boolean;
    readonly hideAmount?: boolean;
    readonly hideOrderId?: boolean;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
    readonly setupActions?: OrderbookAction[];
}): ClaimOrderScenario {

    const givenToken = orderType == OrderType.SELL ? 'baseToken' : 'tradedToken';

    const ordersBefore = applyActions(setupActions, new Orders());

    const ordersAfter = applyActionThatMightFail(createClaimOrderAction({
        orderType,
        price,
        orderId,
        maxAmount,
    }), ordersBefore);

    const amountClaimed = (ordersAfter.get(orderType, price, orderId)?.claimed ?? 0n)
        - (ordersBefore.get(orderType, price, orderId)?.claimed ?? 0n);

    const givenAmount = orderType == OrderType.SELL ?
        amountClaimed * price :
        amountClaimed * contractSize;

    const collectedFee = givenAmount * fee / parseValue(1);

    const deletesOrder = ordersAfter.get(orderType, price, orderId)?.deleted ?? false;

    const prevOrderId = ordersBefore.prevOrderId(orderType, price, orderId);

    const nextOrderId = ordersBefore.nextOrderId(orderType, price, orderId);

    const updatesLastActualOrderId = orderId == ordersBefore.lastActualOrderId(orderType, price);

    return {
        orderType,
        price,
        orderId,
        maxAmount,
        givenToken,
        givenAmount,
        collectedFee,
        amountClaimed,
        deletesOrder,
        prevOrderId,
        nextOrderId,
        updatesLastActualOrderId,
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describeClaimOrderScenario({
                orderType,
                price,
                orderId,
                maxAmount,
                fee,
                contractSize,
                priceTick,
                hideOrderType,
                hidePrice,
                hideAmount,
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
                if (maxAmount != MAX_UINT32) ctx.addContext('maxAmount', maxAmount);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.orderbook.claimOrder(orderType, price, orderId, maxAmount),
                    executeStatic: () => ctx.orderbook.callStatic.claimOrder(orderType, price, orderId, maxAmount),
                };
            },
        }),
    };
}
