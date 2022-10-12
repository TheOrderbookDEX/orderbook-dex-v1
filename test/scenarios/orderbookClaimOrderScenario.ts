import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, applySetupActions, generatorChain, range, repetitions } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, InvalidAmount, InvalidPrice, OrderDeleted, Unauthorized } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { EXHAUSTIVE } from '../config';
import { describer } from '../describer/describer';
import { OrderbookClaimOrderScenario } from '../scenario/OrderbookClaimOrderScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const orderbookClaimOrderScenarios: [string, Iterable<OrderbookClaimOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookClaimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders`,
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
            for (const maxAmount of range(1n, 2n)) {
                yield {
                    ...properties,
                    maxAmount,
                }
            }

        }).then(function*(properties) {
            const { describer, price } = properties;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                new PlaceOrderAction({ describer, orderType, price, amount }));
            for (const setupActions of repetitions(actions, 1, 3)) {
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
            yield properties;

            const { describer, setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.cancelable) {
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
            const { setupActions, price, orderId } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.claimable) {
                yield properties;
            }

        }).then(function*(properties) {
            yield new OrderbookClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookClaimOrderScenarios.push([
        `claim deleted ${describeOrderType(orderType)} orders`,
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
            yield new OrderbookClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookClaimOrderScenarios.push([
        `claim invalid ${describeOrderType(orderType)} orders`,
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
            yield new OrderbookClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    orderbookClaimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'claim 0 contracts',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxAmount: 0n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n })
                ],
                expectedError: InvalidAmount,
            };
            yield {
                describer: 'claim order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n })
                ],
                expectedError: Unauthorized,
            };
            yield {
                describer: 'claim order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedError: InvalidPrice,
            };
            yield {
                describer: 'claim order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedError: InvalidPrice,
            };

        }).then(function*(properties) {
            yield new OrderbookClaimOrderScenario(properties);
        })
    ]);
}
