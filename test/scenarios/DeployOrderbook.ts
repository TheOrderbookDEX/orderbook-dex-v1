import { DeployOrderbookScenario, DeployOrderbookScenarioProperties } from '../scenario/DeployOrderbook';
import { generatorChain } from '@frugal-wizard/contract-test-helper';
import { describer } from '../describer/describer';
import { InvalidAddressBook, InvalidContractSize, InvalidPriceTick, InvalidTokenPair } from '../../src/OrderbookV1';
import { parseValue } from '@frugal-wizard/abi2ts-lib';

export const deployOrderbookScenarios: Iterable<DeployOrderbookScenario> = generatorChain(function*(): Iterable<DeployOrderbookScenarioProperties> {
    yield { describer };
    yield { describer, contractSize: parseValue(20) };
    yield { describer, priceTick: parseValue(2) };
    yield {
        describer,
        addressBookAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidAddressBook,
    };
    yield {
        describer,
        tradedTokenAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidTokenPair,
    };
    yield {
        describer,
        baseTokenAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidTokenPair,
    };
    yield {
        describer,
        tradedTokenAddress: '0x0000000000000000000000000000000000000001',
        baseTokenAddress: '0x0000000000000000000000000000000000000001',
        expectedError: InvalidTokenPair,
    };
    yield {
        describer,
        contractSize: 0n,
        expectedError: InvalidContractSize,
    };
    yield {
        describer,
        priceTick: 0n,
        expectedError: InvalidPriceTick,
    };
}).then(function*(properties) {
    yield new DeployOrderbookScenario(properties);
});
