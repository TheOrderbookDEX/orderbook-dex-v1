import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';

export interface OrderbookFactoryContext extends BaseTestContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
    readonly orderbookFactory: OrderbookFactoryV1;
}

export interface OrderbookFactoryScenarioProperties<TestContext extends OrderbookFactoryContext> extends TestScenarioProperties<TestContext> {
    readonly fee?: bigint;
}

export abstract class OrderbookFactoryScenario<TestContext extends OrderbookFactoryContext, ExecuteResult, ExecuteStaticResult>
    extends TestScenario<TestContext, ExecuteResult, ExecuteStaticResult>
{
    readonly fee: bigint;

    constructor({
        fee = 0n,
        ...rest
    }: OrderbookFactoryScenarioProperties<TestContext>) {
        super(rest);
        this.fee = fee;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.fee) {
            addContext('fee', this.fee);
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OrderbookFactoryContext> {
        const ctx = await super._setup();
        const treasury = await OrderbookDEXTeamTreasuryMock.deploy(this.fee);
        const addressBook = await AddressBook.deploy();
        const orderbookFactory = await OrderbookFactoryV1.deploy(treasury, addressBook);
        return { ...ctx, treasury, addressBook, orderbookFactory };
    }
}
