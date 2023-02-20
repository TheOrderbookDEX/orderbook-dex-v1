import { Token } from '../state/Token';
import { Puppet } from '@theorderbookdex/orderbook-dex/dist/testing/Puppet';
import { AddressBook } from '@frugalwizard/addressbook/dist/AddressBook';
import { Orders } from '../state/Orders';
import { Callable, ERC20ForReentrancyTesting } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20ForReentrancyTesting';
import { ContractError, formatValue, MAX_UINT256, parseValue, Transaction } from '@frugalwizard/abi2ts-lib';
import { ReentrancyAction } from '../action/reentrancy';
import { OrderbookAction } from '../action/orderbook';
import { createEthereumScenario, EthereumScenario, EthereumSetupContext, executeSetupActions, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { OrderbookV1 } from '../../dist/OrderbookV1';
import { DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK } from './orderbook';
import { describeReentrancyScenario } from '../describe/reentrancy';
import { applyActions } from '../utils/actions';

export enum SpecialAccount {
    PUPPET = 'puppet',
}

export interface ReentrancyContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20ForReentrancyTesting;
    readonly baseToken: ERC20ForReentrancyTesting;
    readonly orderbook: OrderbookV1;
    readonly puppet: Puppet;
}

export type ReentrancyScenario = EthereumScenario<TestSetupContext & EthereumSetupContext & ReentrancyContext & {
    execute(): Promise<Transaction>;
    executeStatic(): Promise<string>;
}> & {
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly possibleOrdersAfter: Orders[];
    readonly expectedErrors: ContractError[];
};

export function createReentrancyScenario({
    only,
    description,
    compromisedToken,
    mainAction,
    reentrantAction,
    fee = DEFAULT_FEE,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
    expectedErrors = [],
    setupActions = [],
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly compromisedToken: Token;
    readonly mainAction: ReentrancyAction;
    readonly reentrantAction: ReentrancyAction;
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedErrors?: ContractError[];
    readonly setupActions?: (OrderbookAction | ReentrancyAction)[];
}): ReentrancyScenario {

    const ordersBefore = applyActions(setupActions, new Orders());

    const possibleOrdersAfter = [];
    try {
        possibleOrdersAfter.push(reentrantAction.apply(mainAction.apply(ordersBefore)));
    } catch {
        // ignore
    }
    try {
        possibleOrdersAfter.push(mainAction.apply(reentrantAction.apply(ordersBefore)));
    } catch {
        // ignore
    }

    return {
        fee,
        contractSize,
        priceTick,
        possibleOrdersAfter,
        expectedErrors,

        ...createEthereumScenario({
            only,
            description: description ?? describeReentrancyScenario({
                compromisedToken,
                mainAction,
                reentrantAction,
                fee,
                contractSize,
                priceTick,
                hideContractSize,
                hidePriceTick,
                setupActions,
            }),

            async setup(ctx) {
                ctx.addContext('compromised token', compromisedToken);
                ctx.addContext('main action', mainAction.description);
                ctx.addContext('reentrant action', reentrantAction.description);
                ctx.addContext('expected errors', expectedErrors.length ? expectedErrors.map(error => error.name).join('\n') : 'none');
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('contractSize', formatValue(contractSize));
                ctx.addContext('priceTick', formatValue(priceTick));

                const { accounts } = ctx;

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = await AddressBook.deploy();
                for (const from of accounts.slice(0, 2)) {
                    await addressBook.register({ from });
                }

                const tradedToken = await ERC20ForReentrancyTesting.deploy('Traded Token', 'TRADED', 18);
                await tradedToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));

                const baseToken = await ERC20ForReentrancyTesting.deploy('Base Token', 'BASE', 18);
                await baseToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));

                const orderbook = await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);

                const puppet = await Puppet.deploy();
                await tradedToken.give(puppet, parseValue(1000000));
                await baseToken.give(puppet, parseValue(1000000));
                await puppet.call(addressBook, AddressBook.encode.register());

                return await (async (ctx) => {
                    await executeSetupActions(setupActions, ctx);

                    await puppet.call(tradedToken, tradedToken.encode.approve(orderbook, MAX_UINT256));
                    await puppet.call(baseToken, baseToken.encode.approve(orderbook, MAX_UINT256));
                    await ctx[compromisedToken].callBeforeTransfer(new Callable(puppet, Puppet.encode.call(orderbook, reentrantAction.encode())));

                    return ctx;
                })({
                    ...ctx,
                    treasury,
                    addressBook,
                    tradedToken,
                    baseToken,
                    orderbook,
                    puppet,
                    execute: () => puppet.call(orderbook, mainAction.encode()),
                    executeStatic: () => puppet.callStatic.call(orderbook, mainAction.encode()),
                });
            },
        })
    };
}
