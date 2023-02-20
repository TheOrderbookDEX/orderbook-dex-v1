import { AddressBook } from '@frugalwizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { formatValue } from '@frugalwizard/abi2ts-lib';
import { createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugalwizard/contract-test-helper';

export type OrderbookFactoryScenario<Context> = EthereumScenario<Context> & {
    readonly fee: bigint;
};

export interface OrderbookFactoryContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly orderbookFactory: OrderbookFactoryV1;
}

export function createOrderbookFactoryScenario<Context>({
    only,
    description,
    fee,
    setup,
}: {
    readonly only?: boolean;
    readonly description: string;
    readonly fee: bigint;
    readonly setup: (ctx: TestSetupContext & EthereumSetupContext & OrderbookFactoryContext) => Context | Promise<Context>;
}): OrderbookFactoryScenario<Context> {

    return {
        fee,

        ...createEthereumScenario({
            only,
            description,

            async setup(ctx) {
                ctx.addContext('fee', formatValue(fee));

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = await AddressBook.deploy();

                const orderbookFactory = await OrderbookFactoryV1.deploy(treasury, addressBook);

                return setup({
                    ...ctx,
                    treasury,
                    addressBook,
                    orderbookFactory,
                });
            },
        })
    };
}
