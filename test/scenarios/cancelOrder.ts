import { parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, combinations, generatorChain, permutations, range, repetitions } from '@frugalwizard/contract-test-helper';
import { AlreadyFilled, InvalidOrderId, InvalidPrice, OrderDeleted, OverMaxLastOrderId, Unauthorized } from '../../src/OrderbookV1';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createFillAction } from '../action/fill';
import { createPlaceOrderAction } from '../action/placeOrder';
import { EXHAUSTIVE } from '../config';
import { createCancelOrderScenario } from '../scenario/cancelOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const cancelOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders at same price`,
        generatorChain(function*() {
            yield {
                orderType,
                hideOrderType: true,
                hidePrice: !EXHAUSTIVE,
                hideContractSize: !EXHAUSTIVE,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...props,
                    orderId,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [ createPlaceOrderAction({ orderType, price, amount: 2n, hideOrderType, hidePrice }) ];
            for (const setupActions of repetitions(actions, 1, 3)) {
                yield {
                    ...props,
                    setupActions,
                };
            }

        }).then(function*(props) {
            const { setupActions, price, orderId } = props;
            const orders = applyActions(setupActions, new Orders());
            if (orders.has(orderType, price, orderId)) {
                yield props;
            }

        }).then(function*(props) {
            const { setupActions, price, orderId, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            const totalPlacedBeforeOrder = orders.totalPlacedBeforeOrder(orderType, price, orderId);
            const amount = orders.get(orderType, price, orderId)?.amount ?? 0n;
            for (const maxAmount of range(totalPlacedBeforeOrder, totalPlacedBeforeOrder + amount - 1n)) {
                if (!maxAmount) continue;
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createFillAction({ orderType, maxAmount, hideOrderType, hidePrice })
                    ]
                };
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, price, orderId, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            const unclaimed = order?.unclaimed ?? 0n;
            for (const maxAmount of range(1n, unclaimed)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createClaimOrderAction({ orderType, price, orderId, maxAmount, hideOrderType, hidePrice })
                    ]
                };
            }

        }).then(function*(props) {
            const { setupActions, price, orderId } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.cancelable) {
                yield props;
            }

        }).then(function*(props) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...props,
                    contractSize,
                };
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                orderId: 1n,
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const price of [...range(1, 3)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            const { price, hideOrderType } = props;
            for (const prices of (EXHAUSTIVE ? permutations : combinations)([...range(1, 3)].map(v => parseValue(v)))) {
                if (prices.includes(price)) {
                    yield {
                        ...props,
                        setupActions: prices.map(price =>
                            createPlaceOrderAction({ orderType, price, amount: 1n, hideOrderType })),
                    };
                }
            }

        }).then(function*(props) {
            const { setupActions, price, hideOrderType, hideOrderId } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const prices of permutations(orders.prices(orderType).filter(p => p != price))) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        ...prices.map(price =>
                            createCancelOrderAction({ orderType, price, orderId: 1n, hideOrderType, hideOrderId }))
                    ],
                };
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel deleted ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: new OrderDeleted(),
                hideOrderType: true,
                hidePrice: !EXHAUSTIVE,
                hideContractSize: !EXHAUSTIVE,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...props,
                    orderId,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [
                createPlaceOrderAction({ orderType, price, amount: 1n, hideOrderType, hidePrice })
            ];
            for (const setupActions of repetitions(actions, 1, 3)) {
                yield {
                    ...props,
                    setupActions,
                };
            }

        }).then(function*(props) {
            const { setupActions, price, orderId, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            if (orders.has(orderType, price, orderId)) {
                const totalAvailable = orders.totalAvailable(orderType);
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createFillAction({ orderType, maxAmount: totalAvailable, hideOrderType, hidePrice }),
                        createClaimOrderAction({ orderType, price, orderId, hideOrderType, hidePrice })
                    ]
                };
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createCancelOrderAction({ orderType, price, orderId, hideOrderType, hidePrice })
                    ]
                };
            }

        }).then(function*(props) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...props,
                    contractSize,
                };
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel invalid ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: new InvalidOrderId(),
                hideOrderType: true,
                hidePrice: !EXHAUSTIVE,
                hideContractSize: !EXHAUSTIVE,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...props,
                    orderId,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [
                createPlaceOrderAction({ orderType, price, amount: 1n, hideOrderType, hidePrice })
            ];
            for (const setupActions of repetitions(actions, 0, 2)) {
                yield {
                    ...props,
                    setupActions,
                };
            }

        }).then(function*(props) {
            const { setupActions, price, orderId } = props;
            const orders = applyActions(setupActions, new Orders());
            if (!orders.has(orderType, price, orderId)) {
                yield props;
            }

        }).then(function*(props) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...props,
                    contractSize,
                };
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders already filled`,
        generatorChain(function*() {
            yield {
                orderType,
                expectedError: new AlreadyFilled(),
                hideOrderType: true,
                hidePrice: !EXHAUSTIVE,
                hideContractSize: !EXHAUSTIVE,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            for (const orderId of range(1n, 3n)) {
                yield {
                    ...props,
                    orderId,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [ createPlaceOrderAction({ orderType, price, amount: 1n, hideOrderType, hidePrice }) ];
            for (const setupActions of repetitions(actions, 3, 3)) {
                yield {
                    ...props,
                    setupActions,
                };
            }

        }).then(function*(props) {
            const { setupActions, price, orderId, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            const totalPlacedBeforeOrder = orders.totalPlacedBeforeOrder(orderType, price, orderId);
            const amount = orders.get(orderType, price, orderId)?.amount ?? 0n;
            yield {
                ...props,
                setupActions: [
                    ...setupActions,
                    createFillAction({ orderType, maxAmount: totalPlacedBeforeOrder + amount, hideOrderType, hidePrice })
                ]
            };

        }).then(function*(props) {
            for (const contractSize of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v * 10))) {
                yield {
                    ...props,
                    contractSize,
                };
            }

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `cancel ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'stop cancel order when order has been placed after it',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxLastOrderId: 1n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: new OverMaxLastOrderId(),
            };

            yield {
                description: 'cancel order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    createPlaceOrderAction({ account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: new Unauthorized(),
            };

            yield {
                description: 'cancel order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedError: new InvalidPrice(),
            };

            yield {
                description: 'cancel order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedError: new InvalidPrice(),
            };

        }).then(function*(props) {
            yield createCancelOrderScenario(props);
        })
    ])),
};
