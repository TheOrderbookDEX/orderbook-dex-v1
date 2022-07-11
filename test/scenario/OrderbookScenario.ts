import { AddContextFunction, applySetupActions, BaseTestContext, TestScenario, TestScenarioProperties } from '@theorderbookdex/contract-test-helper';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@theorderbookdex/addressbook/dist/AddressBook';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { Orders } from '../state/Orders';
import { formatValue, parseValue } from '@theorderbookdex/abi2ts-lib';

type ERC20MockInterface = Pick<ERC20Mock, keyof ERC20Mock>;

export interface OrderbookContext extends BaseTestContext {
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20MockInterface;
    readonly baseToken: ERC20MockInterface;
    readonly orderbook: OrderbookV1;
}

export interface OrderbookScenarioProperties<TestContext extends OrderbookContext>
    extends TestScenarioProperties<TestContext>
{
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export abstract class OrderbookScenario<TestContext extends OrderbookContext, ExecuteResult, ExecuteStaticResult>
    extends TestScenario<TestContext, ExecuteResult, ExecuteStaticResult>
{
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: OrderbookScenarioProperties<TestContext>) {
        super(rest);
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OrderbookContext> {
        const ctx = await super._setup();
        const { accounts } = ctx;
        const addressBook = await AddressBook.deploy();
        for (const from of accounts.slice(0, 2)) {
            await addressBook.register({ from });
        }
        const tradedToken = await this._deployTradedToken();
        await tradedToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));
        const baseToken = await this._deployBaseToken();
        await baseToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));
        const { contractSize, priceTick } = this;
        const orderbook = await OrderbookV1.deploy(addressBook, tradedToken, baseToken, contractSize, priceTick);
        return { ...ctx, addressBook, tradedToken, baseToken, orderbook };
    }

    protected async _deployTradedToken(): Promise<ERC20MockInterface> {
        return await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
    }

    protected async _deployBaseToken(): Promise<ERC20MockInterface> {
        return await ERC20Mock.deploy('Base Token', 'BASE', 18);
    }

    get ordersBefore() {
        return applySetupActions(this.setupActions, new Orders());
    }

    abstract get ordersAfter(): Orders;
}
