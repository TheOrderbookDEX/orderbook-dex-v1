import { parseValue } from 'abi2ts-lib';
import { applySetupActions, generatorChain, range, repeat } from 'contract-test-helper';
import { InvalidOrderId, Unauthorized, InvalidAmount, InvalidPrice, OrderDeleted } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { TransferOrderToOperatorAction } from '../action/TransferOrderToOperatorAction';
import { describer } from '../describer/describer';
import { OperatorClaimOrderScenario } from '../scenario/OperatorClaimOrderScenario';
import { Orders } from '../state/Orders';
import { describeOrderType, OrderType } from '../state/OrderType';

export const operatorClaimOrderScenarios: [string, Iterable<OperatorClaimOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorClaimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders`,
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
            yield new OperatorClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorClaimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders using maxAmount`,
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
            for (const maxAmount of range(1n, 3n)) {
                yield {
                    ...properties,
                    maxAmount,
                };
            }

        }).then(function*(properties) {
            const { describer, price, setupActions } = properties;
            yield {
                ...properties,
                setupActions: [
                    ...setupActions,
                    new PlaceOrderAction({ describer, orderType, price, amount: 3n }),
                    new FillAction({ describer, orderType, maxAmount: 3n }),
                ]
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
            yield new OperatorClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorClaimOrderScenarios.push([
        `claim deleted ${describeOrderType(orderType)} orders`,
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
            yield new OperatorClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorClaimOrderScenarios.push([
        `claim invalid ${describeOrderType(orderType)} orders`,
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
            yield new OperatorClaimOrderScenario(properties);
        })
    ]);
}

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorClaimOrderScenarios.push([
        `claim ${describeOrderType(orderType)} orders with common errors`,
        generatorChain(function*() {
            yield {
                describer: 'claim 0 contracts',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                maxAmount: 0n,
                expectedErrorInResult: new InvalidAmount(),
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n }),
                    new TransferOrderToOperatorAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
            };
            yield {
                describer: 'claim order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };
            yield {
                describer: 'claim order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'claim order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

        }).then(function*(properties) {
            yield new OperatorClaimOrderScenario(properties);
        })
    ]);
    break;
}
