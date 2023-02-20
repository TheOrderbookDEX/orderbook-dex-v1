import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { ContractError, formatValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { createOrderbookFactoryScenario, OrderbookFactoryContext, OrderbookFactoryScenario } from './factory';
import { describeCreateOrderbookScenario } from '../describe/createOrderbook';
import { OrderbookFactoryAction } from '../action/factory';
import { DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK } from './orderbook';
import { Addresses, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { DeployAddress } from '../utils/addresses';

export type CreateOrderbookScenario = OrderbookFactoryScenario<TestSetupContext & EthereumSetupContext & OrderbookFactoryContext & {
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
    execute(): Promise<Transaction>;
    executeStatic(): Promise<string>;
}> & {
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly expectedError?: ContractError;
};

export function createCreateOrderbookScenario({
    only,
    description,
    fee = DEFAULT_FEE,
    tradedTokenAddress = DeployAddress,
    baseTokenAddress = DeployAddress,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
    expectedError,
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly fee?: bigint;
    readonly tradedTokenAddress?: DeployAddress | Addresses;
    readonly baseTokenAddress?: DeployAddress | Addresses;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
    readonly setupActions?: OrderbookFactoryAction[];
}): CreateOrderbookScenario {

    return {
        expectedError,
        contractSize,
        priceTick,

        ...createOrderbookFactoryScenario({
            only,
            description: description ?? describeCreateOrderbookScenario({
                fee,
                tradedTokenAddress,
                baseTokenAddress,
                contractSize,
                priceTick,
                hideContractSize,
                hidePriceTick,
                setupActions,
            }),
            fee,

            async setup(ctx) {
                ctx.addContext('traded token', tradedTokenAddress);
                ctx.addContext('base token', baseTokenAddress);
                ctx.addContext('contractSize', formatValue(contractSize));
                ctx.addContext('priceTick', formatValue(priceTick));

                const tradedToken = tradedTokenAddress == DeployAddress ?
                    await ERC20Mock.deploy('Traded Token', 'TRADED', 18) :
                    ERC20Mock.at(ctx[tradedTokenAddress]);

                const baseToken = baseTokenAddress == DeployAddress ?
                    await ERC20Mock.deploy('Base Token', 'BASE', 18) :
                    ERC20Mock.at(ctx[baseTokenAddress]);

                await executeSetupActions(setupActions, ctx);

                return {
                    ...ctx,
                    tradedToken,
                    baseToken,
                    execute: () => ctx.orderbookFactory.createOrderbook(tradedToken, baseToken, contractSize, priceTick),
                    executeStatic: () => ctx.orderbookFactory.callStatic.createOrderbook(tradedToken, baseToken, contractSize, priceTick),
                };
            },
        }),
    };
}
