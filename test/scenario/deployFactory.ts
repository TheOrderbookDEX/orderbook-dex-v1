import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { ContractError, formatValue } from '@frugal-wizard/abi2ts-lib';
import { Addresses, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugal-wizard/contract-test-helper';
import { DEFAULT_FEE } from './orderbook';
import { describeDeployOrderbookFactoryScenario } from '../describe/deployFactory';
import { DeployAddress } from '../utils/addresses';

export type DeployOrderbookFactoryScenario = {
    readonly expectedError?: ContractError;
} & EthereumScenario<TestSetupContext & EthereumSetupContext & {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    execute(): Promise<OrderbookFactoryV1>;
    executeStatic(): Promise<string>;
}>;

export function createDeployOrderbookFactoryScenario({
    only,
    description,
    fee = DEFAULT_FEE,
    addressBookAddress = DeployAddress,
    expectedError,
}: {
    only?: boolean;
    description?: string;
    fee?: bigint;
    addressBookAddress?: DeployAddress | Addresses;
    expectedError?: ContractError;
}): DeployOrderbookFactoryScenario {

    return {
        expectedError,

        ...createEthereumScenario({
            only,
            description: description ?? describeDeployOrderbookFactoryScenario({
                fee,
                addressBookAddress,
            }),

            async setup(ctx) {
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('address book', addressBookAddress);

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = addressBookAddress == DeployAddress ?
                    await AddressBook.deploy() :
                    AddressBook.at(ctx[addressBookAddress]);

                return {
                    ...ctx,
                    treasury,
                    addressBook,
                    execute: () => OrderbookFactoryV1.deploy(treasury, addressBook),
                    executeStatic: () => OrderbookFactoryV1.callStatic.deploy(treasury, addressBook),
                };
            },
        })
    };
}
