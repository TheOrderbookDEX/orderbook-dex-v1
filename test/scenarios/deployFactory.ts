import { Addresses, generatorChain } from '@frugalwizard/contract-test-helper';
import { InvalidAddressBook } from '../../src/OrderbookFactoryV1';
import { createDeployOrderbookFactoryScenario } from '../scenario/deployFactory';

export const deployOrderbookFactoryScenarios = generatorChain(function*() {
    yield {};

    yield {
        addressBookAddress: Addresses.ZERO,
        expectedError: new InvalidAddressBook(),
    };

}).then(function*(props) {
    yield createDeployOrderbookFactoryScenario(props);
});
