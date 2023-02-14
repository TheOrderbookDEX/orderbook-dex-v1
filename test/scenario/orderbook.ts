import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';

export type OrderbookScenario<Context> = EthereumScenario<Context> & {
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
};

export interface OrderbookContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
    readonly orderbook: OrderbookV1;
}

export const DEFAULT_FEE = 0n;
export const DEFAULT_CONTRACT_SIZE = parseValue(10);
export const DEFAULT_PRICE_TICK = parseValue(1);

export function createOrderbookScenario<Context>({
    only,
    description,
    fee,
    contractSize,
    priceTick,
    setup,
}: {
    readonly only?: boolean;
    readonly description: string;
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly setup: (ctx: TestSetupContext & EthereumSetupContext & OrderbookContext) => Context | Promise<Context>;
}): OrderbookScenario<Context> {

    return {
        fee,
        contractSize,
        priceTick,

        ...createEthereumScenario({
            only,
            description,

            async setup(ctx) {
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('contractSize', formatValue(contractSize));
                ctx.addContext('priceTick', formatValue(priceTick));

                const { accounts } = ctx;

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = await AddressBook.deploy();
                for (const from of accounts.slice(0, 2)) {
                    await addressBook.register({ from });
                }

                const tradedToken = await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
                await tradedToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));

                const baseToken = await ERC20Mock.deploy('Base Token', 'BASE', 18);
                await baseToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));

                const orderbook = await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);

                return setup({
                    ...ctx,
                    treasury,
                    addressBook,
                    tradedToken,
                    baseToken,
                    orderbook,
                });
            },
        })
    };
}
