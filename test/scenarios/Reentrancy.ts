import { parseValue } from '@frugal-wizard/abi2ts-lib';
import { Account, generatorChain } from '@frugal-wizard/contract-test-helper';
import { OrderDeleted } from '../../src/OrderbookV1';
import { CannotPlaceOrder } from '../../src/OrderbookV1';
import { CancelOrderUsingPuppetAction } from '../action/CancelOrderUsingPuppet';
import { ClaimOrderUsingPuppetAction } from '../action/ClaimOrderUsingPuppet';
import { FillAction } from '../action/Fill';
import { FillUsingPuppetAction } from '../action/FillUsingPuppet';
import { PlaceOrderAction } from '../action/PlaceOrder';
import { PlaceOrderUsingPuppetAction } from '../action/PlaceOrderUsingPuppet';
import { describer } from '../describer/describer';
import { ReentrancyScenario } from '../scenario/Reentrancy';
import { OrderType } from '../state/OrderType';
import { Token } from '../state/Token';

export const reentrancyScenarios: [string, Iterable<ReentrancyScenario>][] = [];

reentrancyScenarios.push([
    'placeOrder',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hidePrice: true,
                hideAmount: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAccount: true,
            })
        };

    }).then(function*({ describer }) {
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            reentrantAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
        };
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
            reentrantAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
        };
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            reentrantAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
            expectedErrors: [
                CannotPlaceOrder,
            ],
        };
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
            reentrantAction: new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            expectedErrors: [
                CannotPlaceOrder,
            ],
        };

    }).then(function*(properties) {
        yield new ReentrancyScenario(properties);
    })
]);

reentrancyScenarios.push([
    'fill',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hideAmount: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAccount: true,
            })
        };

    }).then(function*({ describer }) {
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new FillUsingPuppetAction({ describer, orderType: OrderType.SELL, maxAmount: 1n }),
            reentrantAction: new FillUsingPuppetAction({ describer, orderType: OrderType.SELL, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(2), amount: 1n }),
            ],
        };
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new FillUsingPuppetAction({ describer, orderType: OrderType.SELL, maxAmount: 1n }),
            reentrantAction: new FillUsingPuppetAction({ describer, orderType: OrderType.SELL, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.SELL, price: parseValue(2), amount: 1n }),
            ],
        };
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new FillUsingPuppetAction({ describer, orderType: OrderType.BUY, maxAmount: 1n }),
            reentrantAction: new FillUsingPuppetAction({ describer, orderType: OrderType.BUY, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.BUY, price: parseValue(2), amount: 1n }),
            ],
        };
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new FillUsingPuppetAction({ describer, orderType: OrderType.BUY, maxAmount: 1n }),
            reentrantAction: new FillUsingPuppetAction({ describer, orderType: OrderType.BUY, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, orderType: OrderType.BUY, price: parseValue(2), amount: 1n }),
            ],
        };

    }).then(function*(properties) {
        yield new ReentrancyScenario(properties);
    })
]);

reentrancyScenarios.push([
    'claimOrder',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hidePrice: true,
                hideAmount: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAccount: true,
            })
        };

    }).then(function*({ describer }) {
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            reentrantAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 2n }),
                new FillAction({ describer, orderType: OrderType.SELL, maxAmount: 2n }),
            ],
        };
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            reentrantAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, account: Account.SECOND, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new FillAction({ describer, orderType: OrderType.SELL, maxAmount: 2n }),
            ],
            expectedErrors: [
                OrderDeleted,
            ],
        };
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            reentrantAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 2n }),
                new FillAction({ describer, orderType: OrderType.BUY, maxAmount: 2n }),
            ],
        };
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            reentrantAction: new ClaimOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, account: Account.SECOND, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
                new FillAction({ describer, orderType: OrderType.BUY, maxAmount: 2n }),
            ],
            expectedErrors: [
                OrderDeleted,
            ],
        };

    }).then(function*(properties) {
        yield new ReentrancyScenario(properties);
    })
]);

reentrancyScenarios.push([
    'cancelOrder',
    generatorChain(function*() {
        yield {
            describer: describer.clone().configure({
                hidePrice: true,
                hideAmount: true,
                hideOrderId: true,
                hideContractSize: true,
                hidePriceTick: true,
                hideAccount: true,
            })
        };

    }).then(function*({ describer }) {
        yield {
            describer,
            compromisedToken: Token.TRADED,
            mainAction: new CancelOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n }),
            reentrantAction: new CancelOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), orderId: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, account: Account.SECOND, orderType: OrderType.SELL, price: parseValue(1), amount: 1n }),
            ],
            expectedErrors: [
                OrderDeleted,
            ],
        };
        yield {
            describer,
            compromisedToken: Token.BASE,
            mainAction: new CancelOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n }),
            reentrantAction: new CancelOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), orderId: 1n }),
            setupActions: [
                new PlaceOrderUsingPuppetAction({ describer, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
                new PlaceOrderAction({ describer, account: Account.SECOND, orderType: OrderType.BUY, price: parseValue(1), amount: 1n }),
            ],
            expectedErrors: [
                OrderDeleted,
            ],
        };

    }).then(function*(properties) {
        yield new ReentrancyScenario(properties);
    })
]);
