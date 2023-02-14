import { createOrderbookScenario, DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK, OrderbookContext, OrderbookScenario } from './orderbook';
import { EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { ContractError, Transaction } from '@frugal-wizard/abi2ts-lib';
import { describeClaimFeesScenario } from '../describe/claimFees';
import { OrderbookAction } from '../action/orderbook';

export type ClaimFeesScenario = OrderbookScenario<TestSetupContext & EthereumSetupContext & OrderbookContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<void>;
}> & {
    readonly expectedError?: ContractError;
};

export function createClaimFeesScenario({
    only,
    description,
    usingTreasury = true,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
    expectedError,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly usingTreasury?: boolean;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
    readonly setupActions?: OrderbookAction[];
}): ClaimFeesScenario {

    return {
        expectedError,

        ...createOrderbookScenario({
            only,
            description: description ?? describeClaimFeesScenario({
                fee,
                contractSize,
                priceTick,
                hideContractSize,
                hidePriceTick,
                setupActions,
            }),
            fee,
            contractSize,
            priceTick,

            async setup(ctx) {
                if (usingTreasury) ctx.addContext('using', 'treasury');

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    execute: () => usingTreasury ?
                        ctx.treasury.claimFees(ctx.orderbook) :
                        ctx.orderbook.claimFees(),
                    executeStatic: () => usingTreasury ?
                        ctx.treasury.callStatic.claimFees(ctx.orderbook) :
                        ctx.orderbook.callStatic.claimFees(),
                };
            },
        }),
    };
}
