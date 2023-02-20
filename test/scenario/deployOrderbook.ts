import { Addresses, createEthereumScenario, EthereumScenario, EthereumSetupContext, TestSetupContext } from '@frugalwizard/contract-test-helper';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@frugalwizard/addressbook/dist/AddressBook';
import { ContractError, formatValue } from '@frugalwizard/abi2ts-lib';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { describeDeployOrderbookFactory } from '../describe/deployOrderbook';
import { DEFAULT_CONTRACT_SIZE, DEFAULT_FEE, DEFAULT_PRICE_TICK } from './orderbook';
import { DeployAddress } from '../utils/addresses';

export type DeployOrderbookScenario = {
    readonly contractSize: bigint;
    readonly priceTick: bigint;
    readonly expectedError?: ContractError;
} & EthereumScenario<TestSetupContext & EthereumSetupContext & {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
    execute(): Promise<OrderbookV1>;
    executeStatic(): Promise<string>;
}>;

export function createDeployOrderbookScenario({
    only,
    description,
    fee = DEFAULT_FEE,
    addressBookAddress = DeployAddress,
    tradedTokenAddress = DeployAddress,
    baseTokenAddress = DeployAddress,
    contractSize = DEFAULT_CONTRACT_SIZE,
    priceTick = DEFAULT_PRICE_TICK,
    hideContractSize = false,
    hidePriceTick = false,
    expectedError,
}: {
    readonly only?: boolean;
    readonly description?: string;
    readonly fee?: bigint;
    readonly addressBookAddress?: DeployAddress | Addresses;
    readonly tradedTokenAddress?: DeployAddress | Addresses;
    readonly baseTokenAddress?: DeployAddress | Addresses;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
    readonly hideContractSize?: boolean;
    readonly hidePriceTick?: boolean;
    readonly expectedError?: ContractError;
}): DeployOrderbookScenario {

    return {
        contractSize,
        priceTick,
        expectedError,

        ...createEthereumScenario({
            only,
            description: description ?? describeDeployOrderbookFactory({
                fee,
                addressBookAddress,
                tradedTokenAddress,
                baseTokenAddress,
                contractSize,
                priceTick,
                hideContractSize,
                hidePriceTick,
            }),

            async setup(ctx) {
                ctx.addContext('fee', formatValue(fee));
                ctx.addContext('address book', addressBookAddress);
                ctx.addContext('traded token', tradedTokenAddress);
                ctx.addContext('base token', baseTokenAddress);
                ctx.addContext('contractSize', formatValue(contractSize));
                ctx.addContext('priceTick', formatValue(priceTick));

                const treasury = await OrderbookDEXTeamTreasuryMock.deploy(fee);

                const addressBook = addressBookAddress == DeployAddress ?
                    await AddressBook.deploy() :
                    AddressBook.at(ctx[addressBookAddress]);

                const tradedToken = tradedTokenAddress == DeployAddress ?
                    await ERC20Mock.deploy('Traded Token', 'TRADED', 18) :
                    ERC20Mock.at(ctx[tradedTokenAddress]);

                const baseToken = baseTokenAddress == DeployAddress ?
                    await ERC20Mock.deploy('Base Token', 'BASE', 18) :
                    ERC20Mock.at(ctx[baseTokenAddress]);

                return {
                    ...ctx,
                    treasury,
                    addressBook,
                    tradedToken,
                    baseToken,
                    execute: () => OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick),
                    executeStatic: () => OrderbookV1.callStatic.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick),
                };
            },
        })
    };
}
