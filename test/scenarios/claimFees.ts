import { parseValue } from '@frugalwizard/abi2ts-lib';
import { generatorChain, range } from '@frugalwizard/contract-test-helper';
import { Unauthorized } from '../../src/OrderbookV1';
import { createClaimFeesAction } from '../action/claimFees';
import { createClaimOrderAction } from '../action/claimOrder';
import { createFillAction } from '../action/fill';
import { createPlaceOrderAction } from '../action/placeOrder';
import { createClaimFeesScenario } from '../scenario/claimFees';
import { Orders } from '../state/Orders';
import { OrderType } from '../state/OrderType';
import { applyActions } from '../utils/actions';

export const claimFeesScenarios = {
    [`claim fees`]: generatorChain(function*() {
        yield {
            hideContractSize: true,
            hidePriceTick: true,
            setupActions: [],
        };

    }).then(function*(props) {
        for (const fee of [ '0.0001', '0.0002', '0.0003' ].map(v => parseValue(v))) {
            yield {
                ...props,
                fee,
            };
        }

    }).then(function*(props) {
        const { setupActions } = props;
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const price of [...range(1, 2)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createPlaceOrderAction({ orderType, price, amount: 1n }),
                        createFillAction({ orderType, maxAmount: 1n })
                    ]
                };
            }
        }

    }).then(function*(props) {
        yield props;

        const { setupActions } = props;
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const price of [...range(1, 2)].map(v => parseValue(v))) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createPlaceOrderAction({ orderType, price, amount: 1n }),
                        createFillAction({ orderType, maxAmount: 1n })
                    ]
                };

                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createClaimFeesAction(),
                        createPlaceOrderAction({ orderType, price, amount: 1n }),
                        createFillAction({ orderType, maxAmount: 1n })
                    ]
                };
            }
        }

    }).then(function*(props) {
        yield props;

        const { setupActions } = props;
        const orders = applyActions(setupActions, new Orders());
        for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
            for (const { price, orderId } of orders.claimable(orderType)) {
                yield {
                    ...props,
                    setupActions: [
                        ...setupActions,
                        createClaimOrderAction({ orderType, price, orderId })
                    ]
                };
            }
        }

    }).then(function*(props) {
        yield createClaimFeesScenario(props);
    }),

    [`claim fees with common errors`]: generatorChain(function*() {
        yield {
            description: 'claim fees not using treasury',
            usingTreasury: false,
            expectedError: new Unauthorized(),
        };

    }).then(function*(props) {
        yield createClaimFeesScenario(props);
    }),
};
