import { applySetupActions, combinations, generatorChain, permutations, range, repetitions } from '@frugal-wizard/contract-test-helper';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { PlaceOrderScenario } from '../scenario/PlaceOrder';
import { describeOrderType, OrderType } from '../state/OrderType';
import { PlaceOrderAction } from '../action/PlaceOrder';
import { Orders } from '../state/Orders';
import { FillAction } from '../action/Fill';
import { CancelOrderAction } from '../action/CancelOrder';
import { InvalidAmount } from '../../src/OrderbookV1';
import { InvalidPrice } from '../../src/OrderbookV1';
import { parseValue } from '@frugal-wizard/abi2ts-lib';

export const placeOrderScenarios: [string, Iterable<PlaceOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    placeOrderScenarios.push([
        `place ${describeOrderType(orderType)} orders at same price`,
        generatorChain(function*() {
            yield {
                orderType,
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: !EXHAUSTIVE,
                    hideContractSize: !EXHAUSTIVE,
                    hidePriceTick: true,
                })
            };

        }).then(function*(properties) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...properties,
                    price,
                };
            }

        }).then(function*(properties) {
            for (const amount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
                yield {
                    ...properties,
                    amount,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                new PlaceOrderAction({ describer, orderType, price, amount }));
            for (const setupActions of repetitions(actions, 0, EXHAUSTIVE ? 2 : 1)) {
                yield {
                    ...properties,
                    setupActions,
                };
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new FillAction({ describer, orderType, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const { price, orderId } of orders.cancelable(orderType)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new CancelOrderAction({ describer, orderType, price, orderId })
                    ]
                };
            }

        }).then(function*(properties) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...properties,
                    contractSize,
                };
            }

        }).then(function*(properties) {
            yield new PlaceOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    placeOrderScenarios.push([
        `place ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                amount: 1n,
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                })
            };

        }).then(function*(properties) {
            if (EXHAUSTIVE) {
                for (const price of [...range(1, 3)].map(v => parseValue(v))) {
                    yield {
                        ...properties,
                        price,
                    };
                }
            } else {
                yield {
                    ...properties,
                    price: parseValue(2),
                };
            }

        }).then(function*(properties) {
            const { describer } = properties;
            for (const prices of (EXHAUSTIVE ? permutations : combinations)([...range(1, 3)].map(v => parseValue(v)))) {
                yield {
                    ...properties,
                    setupActions: prices.map(price =>
                        new PlaceOrderAction({ describer, orderType, price, amount: 1n })),
                };
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new FillAction({ describer, orderType, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const { price, orderId } of orders.cancelable(orderType)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new CancelOrderAction({ describer, orderType, price, orderId })
                    ]
                };
            }

        }).then(function*(properties) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...properties,
                    contractSize,
                };
            }

        }).then(function*(properties) {
            yield new PlaceOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    placeOrderScenarios.push([
        `place ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'place order of 0 contracts',
                orderType,
                price: parseValue(1),
                amount: 0n,
                expectedError: InvalidAmount,
            };
            yield {
                describer: 'place order not providing enough allowance',
                orderType,
                price: parseValue(1),
                amount: 1n,
                allowance: parseValue(1) - 1n,
                expectedError: 'ERC20: insufficient allowance',
            };
            yield {
                describer: 'place order at price 0',
                orderType,
                price: parseValue(0),
                amount: 1n,
                expectedError: InvalidPrice,
            };
            yield {
                describer: 'place order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                amount: 1n,
                priceTick: parseValue(10),
                expectedError: InvalidPrice,
            };

        }).then(function*(properties) {
            yield new PlaceOrderScenario(properties);
        })
    ]);
}
