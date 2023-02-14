import { combinations, generatorChain, permutations, range, repetitions } from '@frugal-wizard/contract-test-helper';
import { EXHAUSTIVE } from '../config';
import { describeOrderType, OrderType } from '../state/OrderType';
import { DefaultError, parseValue } from '@frugal-wizard/abi2ts-lib';
import { createPlaceOrderScenario } from '../scenario/placeOrder';
import { createPlaceOrderAction } from '../action/placeOrder';
import { createFillAction } from '../action/fill';
import { Orders } from '../state/Orders';
import { createCancelOrderAction } from '../action/cancelOrder';
import { InvalidAmount, InvalidPrice } from '../../src/OrderbookV1';
import { applyActions } from '../utils/actions';

export const placeOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `place ${describeOrderType(orderType)} orders at same price`,
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
            for (const amount of range(1n, EXHAUSTIVE ? 2n : 1n)) {
                yield {
                    ...props,
                    amount,
                }
            }

        }).then(function*(props) {
            const { price, hideOrderType, hidePrice } = props;
            const actions = [...range(EXHAUSTIVE ? 1n : 2n, 2n)].map(amount =>
                createPlaceOrderAction({ orderType, price, amount, hideOrderType, hidePrice }));
            for (const setupActions of repetitions(actions, 0, EXHAUSTIVE ? 2 : 1)) {
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
            yield createPlaceOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `place ${describeOrderType(orderType)} orders at different prices`,
        generatorChain(function*() {
            yield {
                orderType,
                amount: 1n,
                hideOrderType: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
            };

        }).then(function*(props) {
            if (EXHAUSTIVE) {
                for (const price of [...range(1, 3)].map(v => parseValue(v))) {
                    yield {
                        ...props,
                        price,
                    };
                }
            } else {
                yield {
                    ...props,
                    price: parseValue(2),
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
            yield props;

            const { setupActions, hideOrderType, hideOrderId } = props;
            const orders = applyActions(setupActions, new Orders());
            for (const { price, orderId } of orders.cancelable(orderType)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createCancelOrderAction({ orderType, price, orderId, hideOrderType, hideOrderId })
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
            yield createPlaceOrderScenario(props);
        })
    ])),

    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `place ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                description: 'place order of 0 contracts',
                orderType,
                price: parseValue(1),
                amount: 0n,
                expectedError: new InvalidAmount(),
            };

            yield {
                description: 'place order not providing enough allowance',
                orderType,
                price: parseValue(1),
                amount: 1n,
                allowance: parseValue(1) - 1n,
                expectedError: new DefaultError('ERC20: insufficient allowance'),
            };

            yield {
                description: 'place order at price 0',
                orderType,
                price: parseValue(0),
                amount: 1n,
                expectedError: new InvalidPrice(),
            };

            yield {
                description: 'place order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                amount: 1n,
                priceTick: parseValue(10),
                expectedError: new InvalidPrice(),
            };

        }).then(function*(props) {
            yield createPlaceOrderScenario(props);
        })
    ])),
};
