import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';
import { Account, Addresses, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { describeOrderType, OrderType } from '../state/OrderType';
import { ContractError, formatValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { describeTransferOrderScenario } from '../describe/transferOrder';
import { OrderbookAction } from '../action/orderbook';

export type TransferOrderScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}> & {
    readonly orderType: OrderType;
    readonly price: bigint;
    readonly orderId: bigint;
    readonly newOwner: Account | Addresses;
    readonly expectedError?: ContractError;
};

export function createTransferOrderScenario({
    only,
    description,
    orderType,
    price,
    orderId,
    newOwner,
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
    readonly newOwner: Account | Addresses;
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
}): TransferOrderScenario {

    return {
        orderType,
        price,
        orderId,
        newOwner,
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describeTransferOrderScenario({
                orderType,
                price,
                orderId,
                newOwner,
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
                ctx.addContext('newOwner', newOwner);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => ctx.orderbook.transferOrder(orderType, price, orderId, ctx[newOwner]),
                    executeStatic: () => ctx.orderbook.callStatic.transferOrder(orderType, price, orderId, ctx[newOwner]),
                };
            },
        }),
    };
}
