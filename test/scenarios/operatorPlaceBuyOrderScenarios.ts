import { DefaultError, parseValue } from '@theorderbookdex/abi2ts-lib';
import { generatorChain, range } from '@theorderbookdex/contract-test-helper';
import { InvalidAmount, InvalidPrice } from '../../src/OrderbookV1';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { OperatorPlaceBuyOrderScenario } from '../scenario/OperatorPlaceBuyOrderScenario';
import { OrderType } from '../state/OrderType';

export const operatorPlaceBuyOrderScenarios: [string, Iterable<OperatorPlaceBuyOrderScenario>][] = [];

operatorPlaceBuyOrderScenarios.push([
    'place buy order',
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
        for (const price of [...range(1, 3)].map(v => parseValue(v))) {
            yield {
                ...properties,
                price,
            };
        }

    }).then(function*(properties) {
        yield new OperatorPlaceBuyOrderScenario(properties);
    })
]);

operatorPlaceBuyOrderScenarios.push([
    'place buy order using maxPricePoints',
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
            maxAmount: 4n,
            price: parseValue(3),
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
        yield new OperatorPlaceBuyOrderScenario(properties);
    })
]);

operatorPlaceBuyOrderScenarios.push([
    'place buy order with common errors',
    generatorChain(function*() {
        yield {
            describer: 'place buy order of 0 contracts',
            maxAmount: 0n,
            price: parseValue(1),
            expectedErrorInResult: new InvalidAmount(),
        };
        yield {
            describer: 'place buy order of 0 contracts (on ask price)',
            maxAmount: 0n,
            price: parseValue(1),
            expectedErrorInResult: new InvalidAmount(),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
        };
        yield {
            describer: 'place buy order without funds',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
        };
        yield {
            describer: 'place buy order without funds (on ask price)',
            maxAmount: 1n,
            price: parseValue(1),
            baseTokenBalance: 0n,
            expectedErrorInResult: new DefaultError('ERC20: transfer amount exceeds balance'),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
        };
        yield {
            describer: 'place buy order at price 0',
            maxAmount: 1n,
            price: parseValue(0),
            expectedErrorInResult: new InvalidPrice(),
        };
        yield {
            describer: 'place buy order at price not divisible by price tick',
            maxAmount: 1n,
            price: parseValue(1),
            priceTick: parseValue(10),
            expectedErrorInResult: new InvalidPrice(),
        };

    }).then(function*(properties) {
        yield new OperatorPlaceBuyOrderScenario(properties);
    })
]);
