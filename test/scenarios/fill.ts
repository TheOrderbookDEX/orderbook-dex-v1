import { DefaultError, parseValue } from '@frugal-wizard/abi2ts-lib';
import { combinations, generatorChain, permutations, range, repetitions } from '@frugal-wizard/contract-test-helper';
import { InvalidAmount, InvalidArgument } from '../../src/OrderbookV1';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createFillAction } from '../action/fill';
import { createPlaceOrderAction } from '../action/placeOrder';
import { EXHAUSTIVE } from '../config';
import { createFillScenario } from '../scenario/fill';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const fillScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders at same price`,
        generatorChain(function*() {
            yield {
                orderType,
                hideOrderType: true,
                hidePrice: !EXHAUSTIVE,
                hideContractSize: !EXHAUSTIVE,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const maxAmount of range(1n, 4n)) {
                yield {
                    ...props,
                    maxAmount,
                }
            }

        }).then(function*(props) {
            for (const price of [...range(1, EXHAUSTIVE ? 2 : 1)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    price,
                };
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                createPlaceOrderAction({ orderType, price, amount, hideOrderType, hidePrice }));
            for (const setupActions of repetitions(actions, EXHAUSTIVE ? 1 : 2, 2)) {
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

            const { setupActions, hideOrderType, hidePrice } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const { price, orderId } of orders.cancelable(orderType)) {
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
            yield createFillScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...props,
                    maxAmount,
                };
            }

        }).then(function*(props) {
            const { hideOrderType } = props;
            for (const prices of (EXHAUSTIVE ? permutations : combinations)([...range(1, 3)].map(v => parseValue(v)))) {
                yield {
                    ...props,
                    setupActions: prices.map(price =>
                        createPlaceOrderAction({ orderType, price, amount: 1n, hideOrderType })),
                };
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, hideOrderType } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType))) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createFillAction({ orderType, maxAmount, hideOrderType })
                    ]
                };
            }

        }).then(function*(props) {
            const { setupActions, hideOrderType, hideOrderId } = props;
            const orders = applyActions(setupActions, new Orders());
            const possibleActions = orders.cancelable(orderType).map(({ price, orderId }) =>
                createCancelOrderAction({ orderType, price, orderId, hideOrderType, hideOrderId }));
            for (const actions of permutations(possibleActions)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        ...actions,
                    ]
                };
            }

        }).then(function*(props) {
            if (EXHAUSTIVE) {
                yield props;
            } else {
                const { maxAmount, setupActions } = props;
                const orders = applyActions(setupActions, new Orders());
                if (maxAmount <= orders.totalAvailable(orderType)) {
                    yield props;
                }
            }

        }).then(function*(props) {
            yield createFillScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders with fee`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            const { hideOrderType } = props;
            yield {
                ...props,
                orderType,
                maxAmount: 3n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(2), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(3), amount: 1n, hideOrderType }),
                ],
            }

        }).then(function*(props) {
            yield props;

            const { setupActions, hideOrderType } = props;
            for (const maxAmount of range(1n, 2n)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createFillAction({ orderType, maxAmount, hideOrderType })
                    ]
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
            yield createFillScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders using maxPrice`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            };

        }).then(function*(props) {
            const { hideOrderType } = props;
            yield {
                ...props,
                orderType,
                maxAmount: 3n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(2), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(3), amount: 1n, hideOrderType }),
                ],
            }

        }).then(function*(props) {
            for (const maxPrice of [...range(1, 3)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    maxPrice,
                };
            }

        }).then(function*(props) {
            yield createFillScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders using maxPricePoints`,
        generatorChain(function*() {
            yield {
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAmount: true,
            };

        }).then(function*(props) {
            const { hideOrderType } = props;
            yield {
                ...props,
                orderType,
                maxAmount: 3n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(2), amount: 1n, hideOrderType }),
                    createPlaceOrderAction({ orderType, price: parseValue(3), amount: 1n, hideOrderType }),
                ],
            }

        }).then(function*(props) {
            for (const maxPricePoints of range(1, 3)) {
                yield {
                    ...props,
                    maxPricePoints,
                };
            }

        }).then(function*(props) {
            yield createFillScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `fill ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'fill 0 contracts',
                orderType,
                maxAmount: 0n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: new InvalidAmount(),
            };
            yield {
                description: 'fill orders not providing enough allowance',
                orderType,
                maxAmount: 1n,
                allowance: parseValue(1) - 1n,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: new DefaultError('ERC20: insufficient allowance'),
            };
            yield {
                description: 'fill orders using maxPricePoints 0',
                orderType,
                maxAmount: 1n,
                maxPricePoints: 0,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n })
                ],
                expectedError: new InvalidArgument(),
            };

        }).then(function*(props) {
            yield createFillScenario(props);
        })
    ])),
};
