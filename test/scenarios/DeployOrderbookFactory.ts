import { generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidAddressBook } from '../../src/OrderbookFactoryV1';
import { describer } from '../describer/describer';
import { DeployOrderbookFactoryScenario } from '../scenario/DeployOrderbookFactory';

export const deployOrderbookFactoryScenarios = generatorChain(function*() {
    yield { describer };

    yield {
        describer,
        addressBookAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidAddressBook,
    };

}).then(function*(properties) {
    yield new DeployOrderbookFactoryScenario(properties);
});
