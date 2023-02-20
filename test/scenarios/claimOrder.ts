import { parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain, range, repetitions } from '@frugalwizard/contract-test-helper';
import { InvalidOrderId, InvalidAmount, InvalidPrice, OrderDeleted, Unauthorized } from '../../src/OrderbookV1';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createFillAction } from '../action/fill';
import { createPlaceOrderAction } from '../action/placeOrder';
import { EXHAUSTIVE } from '../config';
import { createClaimOrderScenario } from '../scenario/claimOrder';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const claimOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders`,
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
            for (const maxAmount of range(1n, 2n)) {
                yield {
                    ...props,
                    maxAmount,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                createPlaceOrderAction({ orderType, price, amount, hideOrderType, hidePrice }));
            for (const setupActions of repetitions(actions, 1, 3)) {
                yield {
                    ...props,
                    setupActions,
                };
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
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
            yield props;

            const { setupActions, price, orderId, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.cancelable) {
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
            const { setupActions, price, orderId } = props;
            const orders = applyActions(setupActions, new Orders());
            const order = orders.get(orderType, price, orderId);
            if (order?.claimable) {
                yield props;
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders with fee`,
        generatorChain(function*() {
            yield {
                orderType,
                orderId: 1n,
                maxAmount: 3n,
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            const { hideOrderType } = props;
            for (const price of [...range(1, 3)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                    setupActions: [
                        createPlaceOrderAction({ orderType, price, amount: 3n, hideOrderType }),
                        createFillAction({ orderType, maxAmount: 3n, hideOrderType }),
                    ],
                };
            }

        }).then(function*(props) {
            yield props;

            const { orderId, price, setupActions, hideOrderType, hideOrderId } = props;
            for (const maxAmount of range(1n, 2n)) {
                yield {
                    ...props,
                    price,
                    setupActions: [
                        ...setupActions,
                        createClaimOrderAction({ orderType, price, orderId, maxAmount, hideOrderType, hideOrderId }),
                    ],
                };
            }

        }).then(function*(props) {
            for (const fee of [ '0.0001', '0.0002', '0.0003' ].map(v => parseValue(v))) {
                yield {
                    ...props,
                    fee,
                };
            }

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim deleted ${describeOrderType(orderType)} orders`,
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
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim invalid ${describeOrderType(orderType)} orders`,
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
            yield createClaimOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `claim ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'claim 0 contracts',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxAmount: 0n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                    createFillAction({ orderType, maxAmount: 1n })
                ],
                expectedError: new InvalidAmount(),
            };

            yield {
                description: 'claim order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    createPlaceOrderAction({ account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                    createFillAction({ orderType, maxAmount: 1n })
                ],
                expectedError: new Unauthorized(),
            };

            yield {
                description: 'claim order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedError: new InvalidPrice(),
            };

            yield {
                description: 'claim order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedError: new InvalidPrice(),
            };

        }).then(function*(props) {
            yield createClaimOrderScenario(props);
        })
    ])),
};
