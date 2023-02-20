import { createDeployOrderbookScenario } from '../scenario/deployOrderbook';
import { Addresses, generatorChain } from '@frugalwizard/contract-test-helper';
import { InvalidAddressBook, InvalidContractSize, InvalidPriceTick, InvalidTokenPair } from '../../src/OrderbookV1';
import { parseValue } from '@frugalwizard/abi2ts-lib';

export const deployOrderbookScenarios = generatorChain(function*() {
    yield {};
    yield { contractSize: parseValue(20) };
    yield { priceTick: parseValue(2) };
    yield {
        addressBookAddress: Addresses.ZERO,
        expectedError: new InvalidAddressBook(),
    };
    yield {
        tradedTokenAddress: Addresses.ZERO,
        expectedError: new InvalidTokenPair(),
    };
    yield {
        baseTokenAddress: Addresses.ZERO,
        expectedError: new InvalidTokenPair(),
    };
    yield {
        tradedTokenAddress: Addresses.RANDOM,
        baseTokenAddress: Addresses.RANDOM,
        expectedError: new InvalidTokenPair(),
    };
    yield {
        contractSize: 0n,
        expectedError: new InvalidContractSize(),
    };
    yield {
        priceTick: 0n,
        expectedError: new InvalidPriceTick(),
    };

}).then(function*(props) {
    yield createDeployOrderbookScenario(props);
});
