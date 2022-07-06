import { parseValue } from 'abi2ts-lib';
import { applySetupActions, combinations, generatorChain, permutations, range, repetitions } from 'contract-test-helper';
import { InvalidAmount, InvalidArgument } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { OrderbookFillScenario } from '../scenario/OrderbookFillScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const orderbookFillScenarios: [string, Iterable<OrderbookFillScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookFillScenarios.push([
        `fill ${describeOrderType(orderType)} orders at same price`,
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
            for (const maxAmount of range(1n, 4n)) {
                yield {
                    ...properties,
                    maxAmount,
                }
            }

        }).then(function*(properties) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...properties,
                    price,
                };
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                new PlaceOrderAction({ describer, orderType, price, amount }));
            for (const setupActions of repetitions(actions, EXHAUSTIVE ? 1 : 2, 2)) {
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
            yield new OrderbookFillScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookFillScenarios.push([
        `fill ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                })
            };

        }).then(function*(properties) {
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...properties,
                    maxAmount,
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
            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const possibleActions = orders.cancelable(orderType).map(({ price, orderId }) =>
                new CancelOrderAction({ describer, orderType, price, orderId }));
            for (const actions of permutations(possibleActions)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        ...actions,
                    ]
                };
            }

        }).then(function*(properties) {
            if (EXHAUSTIVE) {
                yield properties;
            } else {
                const { maxAmount, setupActions } = properties;
                const orders = applySetupActions(setupActions, new Orders());
                if (maxAmount <= orders.totalAvailable(orderType)) {
                    yield properties;
                }
            }

        }).then(function*(properties) {
            yield new OrderbookFillScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookFillScenarios.push([
        `fill ${describeOrderType(orderType)} orders using maxPrice`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
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
                orderType,
                maxAmount: 3n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new PlaceOrderAction({ describer, orderType, price: parseValue(2), amount: 1n }),
                    new PlaceOrderAction({ describer, orderType, price: parseValue(3), amount: 1n }),
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
            yield new OrderbookFillScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookFillScenarios.push([
        `fill ${describeOrderType(orderType)} orders using maxPricePoints`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
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
                orderType,
                maxAmount: 3n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new PlaceOrderAction({ describer, orderType, price: parseValue(2), amount: 1n }),
                    new PlaceOrderAction({ describer, orderType, price: parseValue(3), amount: 1n }),
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
            yield new OrderbookFillScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookFillScenarios.push([
        `fill ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'fill 0 contracts',
                orderType,
                maxAmount: 0n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: InvalidAmount,
            };
            yield {
                describer: 'fill orders not providing enough allowance',
                orderType,
                maxAmount: 1n,
                allowance: parseValue(1) - 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: 'ERC20: insufficient allowance',
            };
            yield {
                describer: 'fill orders using maxPricePoints 0',
                orderType,
                maxAmount: 1n,
                maxPricePoints: 0,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: InvalidArgument,
            };

        }).then(function*(properties) {
            yield new OrderbookFillScenario(properties);
        })
    ]);
}
