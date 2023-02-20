import { parseValue } from '@frugalwizard/abi2ts-lib';
import { NotRegistered } from '@frugalwizard/addressbook/dist/utils/AddressBookUtil';
import { Account, Addresses, generatorChain } from '@frugalwizard/contract-test-helper';
import { InvalidOrderId, InvalidPrice, OrderDeleted, Unauthorized } from '../../src/OrderbookV1';
import { createCancelOrderAction } from '../action/cancelOrder';
import { createClaimOrderAction } from '../action/claimOrder';
import { createFillAction } from '../action/fill';
import { createPlaceOrderAction } from '../action/placeOrder';
import { createTransferOrderScenario } from '../scenario/transferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';

export const transferOrderScenarios = {
    ...Object.fromEntries([ OrderType.SELL, OrderType.BUY ].map(orderType => [
        `transfer ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                description: 'transfer order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                ],
            };

            yield {
                description: 'transfer order to not registered account',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.THIRD,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: new NotRegistered(),
            };

            yield {
                description: 'transfer order to zero address',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Addresses.ZERO,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: new NotRegistered(),
            };

            yield {
                description: 'transfer invalid order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [],
                expectedError: new InvalidOrderId(),
            };

            yield {
                description: 'transfer canceled order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                    createCancelOrderAction({ orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedError: new OrderDeleted(),
            };

            yield {
                description: 'transfer fully claimed order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    createPlaceOrderAction({ orderType, price: parseValue(1), amount: 1n }),
                    createFillAction({ orderType, maxAmount: 1n }),
                    createClaimOrderAction({ orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedError: new OrderDeleted(),
            };

            yield {
                description: 'transfer order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    createPlaceOrderAction({ account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: new Unauthorized(),
            };

            yield {
                description: 'transfer order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                newOwner: Account.SECOND,
                expectedError: new InvalidPrice(),
            };

            yield {
                description: 'transfer order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                priceTick: parseValue(10),
                expectedError: new InvalidPrice(),
            };

        }).then(function*(props) {
            yield createTransferOrderScenario(props);
        })
    ])),
};
