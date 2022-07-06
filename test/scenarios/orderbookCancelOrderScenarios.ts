import { parseValue } from 'abi2ts-lib';
import { Account, applySetupActions, combinations, generatorChain, permutations, range, repetitions } from 'contract-test-helper';
import { AlreadyFilled, InvalidOrderId, InvalidPrice, OrderDeleted, OverMaxLastOrderId, Unauthorized } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { OrderbookCancelOrderScenario } from '../scenario/OrderbookCancelOrderScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const orderbookCancelOrderScenarios: [string, Iterable<OrderbookCancelOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders at same price`,
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
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...properties,
                    orderId,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [ new PlaceOrderAction({ describer, orderType, price, amount: 2n }) ];
            for (const setupActions of repetitions(actions, 1, 3)) {
                yield {
                    ...properties,
                    setupActions,
                };
            }

        }).then(function*(properties) {
            const { setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            if (orders.has(orderType, price, orderId)) {
                yield properties;
            }

        }).then(function*(properties) {
            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const totalPlacedBeforeOrder = orders.totalPlacedBeforeOrder(orderType, price, orderId);
            const amount = orders.get(orderType, price, orderId)?.amount ?? 0n;
            for (const maxAmount of range(totalPlacedBeforeOrder, totalPlacedBeforeOrder + amount - 1n)) {
                if (!maxAmount) continue;
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

            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimOrderAction({ describer, orderType, price, orderId, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            const { setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.cancelable) {
                yield properties;
            }

        }).then(function*(properties) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...properties,
                    contractSize,
                };
            }

        }).then(function*(properties) {
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                orderId: 1n,
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                })
            };

        }).then(function*(properties) {
            for (const price of [...range(1, 3)].map(v => parseValue(v))) {
                yield {
                    ...properties,
                    price,
                };
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            for (const prices of (EXHAUSTIVE ? permutations : combinations)([...range(1, 3)].map(v => parseValue(v)))) {
                if (prices.includes(price)) {
                    yield {
                        ...properties,
                        setupActions: prices.map(price =>
                            new PlaceOrderAction({ describer, orderType, price, amount: 1n })),
                    };
                }
            }

        }).then(function*(properties) {
            const { describer, setupActions, price } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const prices of permutations(orders.prices(orderType).filter(p => p != price))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        ...prices.map(price =>
                            new CancelOrderAction({ describer, orderType, price, orderId: 1n }))
                    ],
                };
            }

        }).then(function*(properties) {
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel deleted ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: OrderDeleted,
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
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...properties,
                    orderId,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [
                new PlaceOrderAction({ describer, orderType, price, amount: 1n })
            ];
            for (const setupActions of repetitions(actions, 1, 3)) {
                yield {
                    ...properties,
                    setupActions,
                };
            }

        }).then(function*(properties) {
            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            if (orders.has(orderType, price, orderId)) {
                const totalAvailable = orders.totalAvailable(orderType);
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new FillAction({ describer, orderType, maxAmount: totalAvailable }),
                        new ClaimOrderAction({ describer, orderType, price, orderId })
                    ]
                };
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
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel invalid ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: InvalidOrderId,
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
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...properties,
                    orderId,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [
                new PlaceOrderAction({ describer, orderType, price, amount: 1n })
            ];
            for (const setupActions of repetitions(actions, 0, 2)) {
                yield {
                    ...properties,
                    setupActions,
                };
            }

        }).then(function*(properties) {
            const { setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            if (!orders.has(orderType, price, orderId)) {
                yield properties;
            }

        }).then(function*(properties) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...properties,
                    contractSize,
                };
            }

        }).then(function*(properties) {
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders already filled`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: AlreadyFilled,
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
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...properties,
                    orderId,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [ new PlaceOrderAction({ describer, orderType, price, amount: 1n }) ];
            for (const setupActions of repetitions(actions, 3, 3)) {
                yield {
                    ...properties,
                    setupActions,
                };
            }

        }).then(function*(properties) {
            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const totalPlacedBeforeOrder = orders.totalPlacedBeforeOrder(orderType, price, orderId);
            const amount = orders.get(orderType, price, orderId)?.amount ?? 0n;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new FillAction({ describer, orderType, maxAmount: totalPlacedBeforeOrder + amount })
                ]
            };

        }).then(function*(properties) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...properties,
                    contractSize,
                };
            }

        }).then(function*(properties) {
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'stop cancel order when order has been placed after it',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxLastOrderId: 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: OverMaxLastOrderId,
            };
            yield {
                describer: 'cancel order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: Unauthorized,
            };
            yield {
                describer: 'cancel order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedError: InvalidPrice,
            };
            yield {
                describer: 'cancel order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedError: InvalidPrice,
            };

        }).then(function*(properties) {
            yield new OrderbookCancelOrderScenario(properties);
        })
    ]);
}
