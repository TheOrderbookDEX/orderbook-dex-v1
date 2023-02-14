import { Addresses, generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidContractSize, InvalidPriceTick, InvalidTokenPair } from '../../src/OrderbookV1';
import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { createCreateOrderbookScenario } from '../scenario/createOrderbook';
import { createCreateOrderbookAction } from '../action/createOrderbook';

export const createOrderbookScenarios = generatorChain(function*() {
    yield {
        hideContractSize: true,
        hidePriceTick: true,
    };

}).then(function*(props) {
    const { hideContractSize, hidePriceTick } = props;

    yield {
        ...props,
    };

    yield {
        ...props,
        hideContractSize: false,
        contractSize: parseValue(20),
    };

    yield {
        ...props,
        hidePriceTick: false,
        priceTick: parseValue(2),
    };

    yield {
        ...props,
        setupActions: [
            createCreateOrderbookAction({ hideContractSize, hidePriceTick }),
        ],
    };

    yield {
        ...props,
        setupActions: [
            createCreateOrderbookAction({ hideContractSize, hidePriceTick }),
            createCreateOrderbookAction({ hideContractSize, hidePriceTick }),
        ],
    };

    yield {
        ...props,
        tradedTokenAddress: Addresses.ZERO,
        expectedError: new InvalidTokenPair,
    };

    yield {
        ...props,
        baseTokenAddress: Addresses.ZERO,
        expectedError: new InvalidTokenPair,
    };

    yield {
        ...props,
        tradedTokenAddress: Addresses.RANDOM,
        baseTokenAddress: Addresses.RANDOM,
        expectedError: new InvalidTokenPair,
    };

    yield {
        ...props,
        hideContractSize: false,
        contractSize: 0n,
        expectedError: new InvalidContractSize,
    };

    yield {
        ...props,
        hidePriceTick: false,
        priceTick: 0n,
        expectedError: new InvalidPriceTick,
    };

}).then(function*(props) {
    yield createCreateOrderbookScenario(props);
});
