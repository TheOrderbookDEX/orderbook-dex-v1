import { parseValue } from '@frugalwizard/abi2ts-lib';
import { Account, generatorChain } from '@frugalwizard/contract-test-helper';
import { OrderDeleted } from '../../src/OrderbookV1';
import { CannotPlaceOrder } from '../../src/OrderbookV1';
import { createCancelOrderUsingPuppetAction } from '../action/cancelOrderUsingPuppet';
import { createClaimOrderUsingPuppetAction } from '../action/claimOrderUsingPuppet';
import { createFillAction } from '../action/fill';
import { createFillUsingPuppetAction } from '../action/fillUsingPuppet';
import { createPlaceOrderAction } from '../action/placeOrder';
import { createPlaceOrderUsingPuppetAction } from '../action/placeOrderUsingPuppet';
import { createReentrancyScenario } from '../scenario/reentrancy';
import { OrderType } from '../state/OrderType';
import { Token } from '../state/Token';

export const reentrancyScenarios = {
    ['placeOrder']: generatorChain(function*() {
        yield {
            hidePrice: true,
            hideAmount: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAccount: true,
        };

    }).then(function*(props) {
        const { hidePrice, hideAmount, hideAccount } = props;

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            reentrantAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
        };

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            reentrantAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
        };

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            reentrantAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            expectedErrors: [
                new CannotPlaceOrder(),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            reentrantAction: createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            expectedErrors: [
                new CannotPlaceOrder(),
            ],
        };

    }).then(function*(props) {
        yield createReentrancyScenario(props);
    }),

    ['fill']: generatorChain(function*() {
        yield {
            hideAmount: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAccount: true,
        };

    }).then(function*(props) {
        const { hideAmount, hideAccount } = props;

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createFillUsingPuppetAction({ orderType: OrderType.SELL, maxAmount: 1n, hideAmount, hideAccount }),
            reentrantAction: createFillUsingPuppetAction({ orderType: OrderType.SELL, maxAmount: 1n, hideAmount, hideAccount }),
            setupActions: [
                createPlaceOrderAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hideAmount, hideAccount }),
                createPlaceOrderAction({ orderType: OrderType.SELL, price: parseValue(2), amount: 1n, hideAmount, hideAccount }),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createFillUsingPuppetAction({ orderType: OrderType.SELL, maxAmount: 1n, hideAmount, hideAccount }),
            reentrantAction: createFillUsingPuppetAction({ orderType: OrderType.SELL, maxAmount: 1n, hideAmount, hideAccount }),
            setupActions: [
                createPlaceOrderAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hideAmount, hideAccount }),
                createPlaceOrderAction({ orderType: OrderType.SELL, price: parseValue(2), amount: 1n, hideAmount, hideAccount }),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createFillUsingPuppetAction({ orderType: OrderType.BUY, maxAmount: 1n, hideAmount, hideAccount }),
            reentrantAction: createFillUsingPuppetAction({ orderType: OrderType.BUY, maxAmount: 1n, hideAmount, hideAccount }),
            setupActions: [
                createPlaceOrderAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hideAmount, hideAccount }),
                createPlaceOrderAction({ orderType: OrderType.BUY, price: parseValue(2), amount: 1n, hideAmount, hideAccount }),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createFillUsingPuppetAction({ orderType: OrderType.BUY, maxAmount: 1n, hideAmount, hideAccount }),
            reentrantAction: createFillUsingPuppetAction({ orderType: OrderType.BUY, maxAmount: 1n, hideAmount, hideAccount }),
            setupActions: [
                createPlaceOrderAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hideAmount, hideAccount }),
                createPlaceOrderAction({ orderType: OrderType.BUY, price: parseValue(2), amount: 1n, hideAmount, hideAccount }),
            ],
        };

    }).then(function*(props) {
        yield createReentrancyScenario(props);
    }),

    ['claimOrder']: generatorChain(function*() {
        yield {
            hidePrice: true,
            hideAmount: true,
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAccount: true,
        };

    }).then(function*(props) {
        const { hidePrice, hideAmount, hideOrderId, hideAccount } = props;

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            reentrantAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 2n, hidePrice, hideAmount, hideAccount }),
                createFillAction({ orderType: OrderType.SELL, maxAmount: 2n, hidePrice, hideAmount }),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            reentrantAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createPlaceOrderAction({ account: Account.SECOND, orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createFillAction({ orderType: OrderType.SELL, maxAmount: 2n, hidePrice, hideAmount }),
            ],
            expectedErrors: [
                new OrderDeleted(),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            reentrantAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 2n, hidePrice, hideAmount, hideAccount }),
                createFillAction({ orderType: OrderType.BUY, maxAmount: 2n, hidePrice, hideAmount }),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            reentrantAction: createClaimOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, maxAmount: 1n, hidePrice, hideAmount, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createPlaceOrderAction({ account: Account.SECOND, orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createFillAction({ orderType: OrderType.BUY, maxAmount: 2n, hidePrice, hideAmount }),
            ],
            expectedErrors: [
                new OrderDeleted(),
            ],
        };

    }).then(function*(props) {
        yield createReentrancyScenario(props);
    }),

    ['cancelOrder']: generatorChain(function*() {
        yield {
            hidePrice: true,
            hideAmount: true,
            hideOrderId: true,
            hideContractSize: true,
            hidePriceTick: true,
            hideAccount: true,
        };

    }).then(function*(props) {
        const { hidePrice, hideAmount, hideOrderId, hideAccount } = props;

        yield {
            ...props,
            compromisedToken: Token.TRADED,
            mainAction: createCancelOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, hidePrice, hideOrderId, hideAccount }),
            reentrantAction: createCancelOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), orderId: 1n, hidePrice, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createPlaceOrderAction({ account: Account.SECOND, orderType: OrderType.SELL, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            ],
            expectedErrors: [
                new OrderDeleted(),
            ],
        };

        yield {
            ...props,
            compromisedToken: Token.BASE,
            mainAction: createCancelOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, hidePrice, hideOrderId, hideAccount }),
            reentrantAction: createCancelOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), orderId: 1n, hidePrice, hideOrderId, hideAccount }),
            setupActions: [
                createPlaceOrderUsingPuppetAction({ orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
                createPlaceOrderAction({ account: Account.SECOND, orderType: OrderType.BUY, price: parseValue(1), amount: 1n, hidePrice, hideAmount, hideAccount }),
            ],
            expectedErrors: [
                new OrderDeleted(),
            ],
        };

    }).then(function*(props) {
        yield createReentrancyScenario(props);
    }),
};
