import { generatorChain } from '@frugal-wizard/contract-test-helper';
import { describer } from '../describer/describer';
import { InvalidContractSize, InvalidPriceTick, InvalidTokenPair } from '../../src/OrderbookV1';
import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { CreateOrderbookScenario } from '../scenario/CreateOrderbook';
import { CreateOrderbookAction } from '../action/CreateOrderbook';

export const createOrderbookScenarios = generatorChain(function*() {
    yield {
        describer: describer.clone().configure({
            hideContractSize: true,
            hidePriceTick: true,
        }),
    };

}).then(function*(properties) {
    const { describer } = properties;

    yield {
        ...properties,
    };

    yield {
        ...properties,
        describer: describer.clone().configure({
            hidePriceTick: true,
        }),
        contractSize: parseValue(20),
    };

    yield {
        ...properties,
        describer: describer.clone().configure({
            hideContractSize: true,
        }),
        priceTick: parseValue(2),
    };

    yield {
        ...properties,
        setupActions: [
            new CreateOrderbookAction({ describer }),
        ],
    };

    yield {
        ...properties,
        setupActions: [
            new CreateOrderbookAction({ describer }),
            new CreateOrderbookAction({ describer }),
        ],
    };

    yield {
        ...properties,
        tradedTokenAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidTokenPair,
    };

    yield {
        ...properties,
        baseTokenAddress: '0x0000000000000000000000000000000000000000',
        expectedError: InvalidTokenPair,
    };

    yield {
        ...properties,
        tradedTokenAddress: '0x0000000000000000000000000000000000000001',
        baseTokenAddress: '0x0000000000000000000000000000000000000001',
        expectedError: InvalidTokenPair,
    };

    yield {
        ...properties,
        describer: describer.clone().configure({
            hidePriceTick: true,
        }),
        contractSize: 0n,
        expectedError: InvalidContractSize,
    };

    yield {
        ...properties,
        describer: describer.clone().configure({
            hideContractSize: true,
        }),
        priceTick: 0n,
        expectedError: InvalidPriceTick,
    };

}).then(function*(properties) {
    yield new CreateOrderbookScenario(properties);
});
