import { DefaultError, parseValue } from 'abi2ts-lib';
import { generatorChain, range } from 'contract-test-helper';
import { InvalidAmount, InvalidArgument } from '../../src/OrderbookV1';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { OperatorBuyAtMarketScenario } from '../scenario/OperatorBuyAtMarketScenario';
import { OrderType } from '../state/OrderType';

export const operatorBuyAtMarketScenarios: [string, Iterable<OperatorBuyAtMarketScenario>][] = [];

operatorBuyAtMarketScenarios.push([
    'buy at market',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            }),
            setupActions: [],
        };

    }).then(function*(properties) {
        for (const maxAmount of range(1n, EXHAUSTIVE ? 6n : 3n)) {
            yield {
                ...properties,
                maxAmount,
            }
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const amount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount })
                ],
            };
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const amount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(2), amount })
                ],
            };
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const amount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(3), amount })
                ],
            };
        }

    }).then(function*(properties) {
        yield new OperatorBuyAtMarketScenario(properties);
    })
]);

operatorBuyAtMarketScenarios.push([
    'buy at market using maxPrice',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            }),
        };

    }).then(function*(properties) {
        const { describer } = properties;
        yield {
            ...properties,
            maxAmount: 3n,
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(2), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(3), amount: 1n }),
            ],
        }

    }).then(function*(properties) {
        for (const maxPrice of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...properties,
                maxPrice,
            };
        }

    }).then(function*(properties) {
        yield new OperatorBuyAtMarketScenario(properties);
    })
]);

operatorBuyAtMarketScenarios.push([
    'buy at market using maxPricePoints',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            }),
        };

    }).then(function*(properties) {
        const { describer } = properties;
        yield {
            ...properties,
            maxAmount: 3n,
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(2), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(3), amount: 1n }),
            ],
        }

    }).then(function*(properties) {
        for (const maxPricePoints of range(1, 3)) {
            yield {
                ...properties,
                maxPricePoints,
            };
        }

    }).then(function*(properties) {
        yield new OperatorBuyAtMarketScenario(properties);
    })
]);

operatorBuyAtMarketScenarios.push([
    'buy at market with common errors',
    generatorChain(function*() {
        yield {
            describer: 'buy at market 0 contracts',
            maxAmount: 0n,
            expectedErrorInResult: new InvalidAmount(),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
        };
        yield {
            describer: 'buy at market without funds',
            maxAmount: 1n,
            baseTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
        };
        yield {
            describer: 'buy at market using maxPricePoints 0',
            maxAmount: 1n,
            maxPricePoints: 0,
            expectedErrorInResult: new InvalidArgument(),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
        };

    }).then(function*(properties) {
        yield new OperatorBuyAtMarketScenario(properties);
    })
]);
