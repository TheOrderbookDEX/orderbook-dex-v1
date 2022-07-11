import { OrderbookContext, OrderbookScenario, OrderbookScenarioProperties } from './OrderbookScenario';
import { AddContextFunction, describeError, TestError } from '@theorderbookdex/contract-test-helper';
import { Token } from '../state/Token';
import { Puppet } from '@theorderbookdex/orderbook-dex/dist/testing/Puppet';
import { AddressBook } from '@theorderbookdex/addressbook/dist/AddressBook';
import { Orders } from '../state/Orders';
import { Callable, ERC20ForReentrancyTesting } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20ForReentrancyTesting';
import { parseValue, Transaction } from '@theorderbookdex/abi2ts-lib';
import { OrderOwner, SpecialAccount } from '../state/Order';
import { ReentrancyAction } from '../action/ReentrancyAction';

type ERC20ForReentrancyTestingInterface = Pick<ERC20ForReentrancyTesting, keyof ERC20ForReentrancyTesting>;

export interface OrderbookReentrancyContext extends OrderbookContext {
    readonly tradedToken: ERC20ForReentrancyTestingInterface;
    readonly baseToken: ERC20ForReentrancyTestingInterface;
    readonly puppet: Puppet;
    getOwnerAddress(owner: OrderOwner): string;
}

export interface OrderbookReentrancyScenarioProperties extends OrderbookScenarioProperties<OrderbookReentrancyContext> {
    readonly compromisedToken: Token;
    readonly mainAction: ReentrancyAction;
    readonly reentrantAction: ReentrancyAction;
    readonly expectedErrors?: TestError[];
}

export class OrderbookReentrancyScenario extends OrderbookScenario<OrderbookReentrancyContext, Transaction, string> {
    readonly compromisedToken: Token;
    readonly mainAction: ReentrancyAction;
    readonly reentrantAction: ReentrancyAction;
    readonly expectedErrors: TestError[];

    constructor({
        compromisedToken,
        mainAction,
        reentrantAction,
        expectedErrors = [],
        ...rest
    }: OrderbookReentrancyScenarioProperties) {
        super(rest);
        this.compromisedToken = compromisedToken;
        this.mainAction = mainAction;
        this.reentrantAction = reentrantAction;
        this.expectedErrors = expectedErrors;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('compromised token', this.compromisedToken);
        addContext('main action', this.mainAction.description);
        addContext('reentrant action', this.reentrantAction.description);
        if (this.expectedErrors.length) {
            addContext('expected errors', this.expectedErrors.map(describeError).join('\n'));
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OrderbookReentrancyContext> {
        const ctx = await super._setup();
        const { tradedToken, baseToken, addressBook } = ctx;
        const puppet = await Puppet.deploy();
        await tradedToken.give(puppet, parseValue(1000000));
        await baseToken.give(puppet, parseValue(1000000));
        await puppet.call(addressBook, AddressBook.encode.register());
        return {
            ...ctx,
            puppet,
            tradedToken: tradedToken as ERC20ForReentrancyTestingInterface,
            baseToken: baseToken as ERC20ForReentrancyTestingInterface,
            getOwnerAddress(owner) {
                switch (owner) {
                    case SpecialAccount.OPERATOR:
                        throw new Error('operator not available');
                    case SpecialAccount.PUPPET:
                        return puppet.address;
                    default:
                        return ctx[owner];
                }
            },
        };
    }

    protected async _deployTradedToken() {
        return await ERC20ForReentrancyTesting.deploy('Traded Token', 'TRADED', 18);
    }

    protected async _deployBaseToken() {
        return await ERC20ForReentrancyTesting.deploy('Base Token', 'BASE', 18);
    }

    async setup() {
        return await this._setup();
    }

    async afterSetup(ctx: OrderbookReentrancyContext) {
        await super.afterSetup(ctx);
        const { puppet, orderbook } = ctx;
        await this.mainAction.approve(ctx);
        await this.reentrantAction.approve(ctx);
        await ctx[this.compromisedToken].callBeforeTransfer(new Callable(puppet, Puppet.encode.call(orderbook, this.reentrantAction.encode())));
    }

    async execute({ puppet, orderbook }: OrderbookReentrancyContext) {
        return await puppet.call(orderbook, this.mainAction.encode());
    }

    async executeStatic({ puppet, orderbook }: OrderbookReentrancyContext) {
        return await puppet.callStatic.call(orderbook, this.mainAction.encode());
    }

    get ordersAfter(): Orders {
        throw new Error('undeterminable');
    }

    get possibleOrdersAfter() {
        const orders = [];
        try {
            orders.push(this.reentrantAction.apply(this.mainAction.apply(this.ordersBefore)));
        } catch {
            // ignore
        }
        try {
            orders.push(this.mainAction.apply(this.reentrantAction.apply(this.ordersBefore)));
        } catch {
            // ignore
        }
        return orders;
    }
}
