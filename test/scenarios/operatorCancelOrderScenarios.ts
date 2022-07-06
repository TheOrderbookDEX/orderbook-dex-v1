import { parseValue } from 'abi2ts-lib';
import { applySetupActions, generatorChain, range, repeat } from 'contract-test-helper';
import { AlreadyFilled, InvalidOrderId, OverMaxLastOrderId, Unauthorized, InvalidPrice, OrderDeleted } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { TransferOrderToOperatorAction } from '../action/TransferOrderToOperatorAction';
import { describer } from '../describer/describer';
import { OperatorCancelOrderScenario } from '../scenario/OperatorCancelOrderScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const operatorCancelOrderScenarios: [string, Iterable<OperatorCancelOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType, price, amount: 3n }),
                ],
            };

        }).then(function*(properties) {
            yield properties;

            const { describer, setupActions } = properties;
            const orders = applySetupActions(setupActions, new Orders());
            for (const maxAmount of range(1n, orders.totalAvailable(orderType) - 1n)) {
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
            for (const maxAmount of range(1n, unclaimed - 1n)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimOrderAction({ describer, orderType, price, orderId, maxAmount })
                    ]
                };
            }

        }).then(function*(properties) {
            const { describer, setupActions, price, orderId } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new TransferOrderToOperatorAction({ describer, orderType, price, orderId })
                ]
            };

        }).then(function*(properties) {
            yield new OperatorCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorCancelOrderScenarios.push([
        `cancel deleted ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideOrderId: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                expectedErrorInResult: new OrderDeleted(),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType, price, amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n }),
                    new ClaimOrderAction({ describer, orderType, price, orderId: 1n }),
                ]
            }
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType, price, amount: 1n }),
                    new CancelOrderAction({ describer, orderType, price, orderId: 1n }),
                ]
            }

        }).then(function*(properties) {
            yield new OperatorCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorCancelOrderScenarios.push([
        `cancel invalid ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                expectedErrorInResult: new InvalidOrderId(),
                orderType,
                price: parseValue(1),
                setupActions: [],
            };

        }).then(function*(properties) {
            for (const orderId of range(0n, 2n)) {
                yield {
                    ...properties,
                    orderId,
                };
            }

        }).then(function*(properties) {
            const { describer, price, setupActions, orderId } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    ...repeat(Number(orderId - 1n), new PlaceOrderAction({ describer, orderType, price, amount: 1n })),
                ]
            }

        }).then(function*(properties) {
            yield new OperatorCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorCancelOrderScenarios.push([
        `cancel ${describeOrderType(orderType)} orders already filled`,
        generatorChain(function*() {
            yield {
                describer: describer.clone().configure({
                    hideOrderType: true,
                    hidePrice: true,
                    hideContractSize: true,
                    hidePriceTick: true,
                }),
                expectedErrorInResult: new AlreadyFilled(),
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [],
            };

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            for (const amount of range(1n, 3n)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new PlaceOrderAction({ describer, orderType, price, amount }),
                        new FillAction({ describer, orderType, maxAmount: amount }),
                    ]
                }
            }

        }).then(function*(properties) {
            const { describer, setupActions, price, orderId } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new TransferOrderToOperatorAction({ describer, orderType, price, orderId })
                ]
            };

        }).then(function*(properties) {
            yield new OperatorCancelOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorCancelOrderScenarios.push([
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
                expectedErrorInResult: new OverMaxLastOrderId(),
            };
            yield {
                describer: 'cancel order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };
            yield {
                describer: 'cancel order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'cancel order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

        }).then(function*(properties) {
            yield new OperatorCancelOrderScenario(properties);
        })
    ]);
    break;
}
