import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { NotRegistered } from '@frugal-wizard/addressbook/dist/utils/AddressBookUtil';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { InvalidOrderId, InvalidPrice, OrderDeleted, Unauthorized } from '../../src/OrderbookV1';
import { CancelOrderAction } from '../action/CancelOrderAction';
import { ClaimOrderAction } from '../action/ClaimOrderAction';
import { FillAction } from '../action/FillAction';
import { PlaceOrderAction } from '../action/PlaceOrderAction';
import { TransferOrderToOperatorAction } from '../action/TransferOrderToOperatorAction';
import { describer } from '../describer/describer';
import { OperatorTransferOrderScenario } from '../scenario/OperatorTransferOrderScenario';
import { describeOrderType, OrderType } from '../state/OrderType';

export const operatorTransferOrderScenarios: [string, Iterable<OperatorTransferOrderScenario>][] = [];

for (const orderType of [ OrderType.SELL, OrderType.BUY ]) {
    operatorTransferOrderScenarios.push([
        `transfer ${describeOrderType(orderType)} orders`,
        generatorChain(function*() {
            yield {
                describer: 'transfer order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new TransferOrderToOperatorAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
            };
            yield {
                describer: 'transfer order to not registered account',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.THIRD,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new TransferOrderToOperatorAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new NotRegistered(),
            };
            yield {
                describer: 'transfer invalid order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [],
                expectedErrorInResult: new InvalidOrderId(),
            };
            yield {
                describer: 'transfer canceled order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new CancelOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };
            yield {
                describer: 'transfer fully claimed order',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                    new FillAction({ describer, orderType, maxAmount: 1n }),
                    new ClaimOrderAction({ describer, orderType, price: parseValue(1), orderId: 1n }),
                ],
                expectedErrorInResult: new OrderDeleted(),
            };
            yield {
                describer: 'transfer order not owned by operator',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                setupActions: [
                    new PlaceOrderAction({ describer, orderType, price: parseValue(1), amount: 1n }),
                ],
                expectedErrorInResult: new Unauthorized(),
            };
            yield {
                describer: 'transfer order at price 0',
                orderType,
                price: parseValue(0),
                orderId: 1n,
                recipient: Account.SECOND,
                expectedErrorInResult: new InvalidPrice(),
            };
            yield {
                describer: 'transfer order at price not divisible by price tick',
                orderType,
                price: parseValue(1),
                orderId: 1n,
                recipient: Account.SECOND,
                priceTick: parseValue(10),
                expectedErrorInResult: new InvalidPrice(),
            };

        }).then(function*(properties) {
            yield new OperatorTransferOrderScenario(properties);
        })
    ]);
}
