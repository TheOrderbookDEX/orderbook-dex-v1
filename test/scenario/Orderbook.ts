import { AddContextFunction, applySetupActions, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { Orders } from '../state/Orders';
import { formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';

type ERC20MockInterface = Pick<ERC20Mock, keyof ERC20Mock>;

export interface OrderbookContext extends BaseTestContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20MockInterface;
    readonly baseToken: ERC20MockInterface;
    readonly orderbook: OrderbookV1;
}

export interface OrderbookScenarioProperties<TestContext extends OrderbookContext>
    extends TestScenarioProperties<TestContext>
{
    readonly fee?: bigint;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export abstract class OrderbookScenario<TestContext extends OrderbookContext, ExecuteResult, ExecuteStaticResult>
    extends TestScenario<TestContext, ExecuteResult, ExecuteStaticResult>
{
    readonly fee: bigint;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        fee = 0n,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: OrderbookScenarioProperties<TestContext>) {
        super(rest);
        this.fee = fee;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.fee) {
            addContext('fee', formatValue(this.fee));
        }
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OrderbookContext> {
        const ctx = await super._setup();
        const { accounts } = ctx;
        const treasury = await OrderbookDEXTeamTreasuryMock.deploy(this.fee);
        const addressBook = await AddressBook.deploy();
        for (const from of accounts.slice(0, 2)) {
            await addressBook.register({ from });
        }
        const tradedToken = await this._deployTradedToken();
        await tradedToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));
        const baseToken = await this._deployBaseToken();
        await baseToken.giveMultiple(accounts.slice(0, 3).map(account => [ account, parseValue(1000000) ]));
        const { contractSize, priceTick } = this;
        const orderbook = await OrderbookV1.deploy(treasury, addressBook, tradedToken, baseToken, contractSize, priceTick);
        return { ...ctx, treasury, addressBook, tradedToken, baseToken, orderbook };
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
