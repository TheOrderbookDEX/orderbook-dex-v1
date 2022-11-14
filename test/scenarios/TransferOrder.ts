import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { NotRegistered } from '@frugal-wizard/addressbook/dist/utils/AddressBookUtil';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, InvalidPrice, OrderDeleted, Unauthorized } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrder';
import { ClaimOrderAction } from '../action/ClaimOrder';
import { FillAction } from '../action/Fill';
import { PlaceOrderAction } from '../action/PlaceOrder';
import { describer } from '../describer/describer';
import { TransferOrderScenario, TransferTo } from '../scenario/TransferOrder';
import { describeOrderType, OrderType } from '../state/OrderType';

export const transferOrderScenarios: [string, Iterable<TransferOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    transferOrderScenarios.push([
        `transfer ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: 'transfer order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
            };
            yield {
                describer: 'transfer order to not registered account',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.THIRD,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: NotRegistered,
            };
            yield {
                describer: 'transfer order to zero address',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: TransferTo.ZERO_ADDRESS,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: NotRegistered,
            };
            yield {
                describer: 'transfer invalid order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [],
                expectedError: InvalidOrderId,
            };
            yield {
                describer: 'transfer canceled order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new CancelOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedError: OrderDeleted,
            };
            yield {
                describer: 'transfer fully claimed order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n }),
                    new ClaimOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedError: OrderDeleted,
            };
            yield {
                describer: 'transfer order owned by someone else',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, account: Account.SECOND, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedError: Unauthorized,
            };
            yield {
                describer: 'transfer order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                newOwner: Account.SECOND,
                expectedError: InvalidPrice,
            };
            yield {
                describer: 'transfer order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                newOwner: Account.SECOND,
                priceTick: parseValue(10),
                expectedError: InvalidPrice,
            };

        }).then(function*(properties) {
            yield new TransferOrderScenario(properties);
        })
    ]);
}