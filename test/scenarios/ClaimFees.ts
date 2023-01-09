import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { applySetupActions, generatorChain, range } from '@frugal-wizard/contract-test-helper';
import { Unauthorized } from '../../src/OrderbookV1';
import { ClaimFeesAction } from '../action/ClaimFees';
import { ClaimOrderAction } from '../action/ClaimOrder';
import { FillAction } from '../action/Fill';
import { PlaceOrderAction } from '../action/PlaceOrder';
import { describer } from '../describer/describer';
import { ClaimFeesScenario } from '../scenario/ClaimFees';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';

export const claimFeesScenarios: [string, Iterable<ClaimFeesScenario>][] = [];

claimFeesScenarios.push([
    `claim fees`,
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideContractSize: true,
                hidePriceTick: true,
            }),
            setupActions: [],
        };

    }).then(function*(properties) {
        for (const fee of [ '0.0001', '0.0002', '0.0003' ].map(v => parseValue(v))) {
            yield {
                ...properties,
                fee,
            };
        }

    }).then(function*(properties) {
        const { describer, setupActions } = properties;
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const price of [...range(1, 2)].map(v => parseValue(v))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new PlaceOrderAction({ describer, orderType, price, amount: 1n }),
                        new FillAction({ describer, orderType, maxAmount: 1n })
                    ]
                };
            }
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const price of [...range(1, 2)].map(v => parseValue(v))) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new PlaceOrderAction({ describer, orderType, price, amount: 1n }),
                        new FillAction({ describer, orderType, maxAmount: 1n })
                    ]
                };

                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimFeesAction({ describer }),
                        new PlaceOrderAction({ describer, orderType, price, amount: 1n }),
                        new FillAction({ describer, orderType, maxAmount: 1n })
                    ]
                };
            }
        }

    }).then(function*(properties) {
        yield properties;

        const { describer, setupActions } = properties;
        const orders = applySetupActions(setupActions, new Orders());
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const { price, orderId } of orders.claimable(orderType)) {
                yield {
                    ...properties,
                    setupActions: [
                        ...setupActions,
                        new ClaimOrderAction({ describer, orderType, price, orderId })
                    ]
                };
            }
        }

    }).then(function*(properties) {
        yield new ClaimFeesScenario(properties);
    })
]);

claimFeesScenarios.push([
    `claim fees with common errors`,
    generatorChain(function*() {
        yield {
            describer: 'claim fees not using treasury',
            usingTreasury: false,
            expectedError: Unauthorized,
        };

    }).then(function*(properties) {
        yield new ClaimFeesScenario(properties);
    })
]);
