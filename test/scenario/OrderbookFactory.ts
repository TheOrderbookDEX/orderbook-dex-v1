import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';

export interface OrderbookFactoryContext extends BaseTestContext {
    readonly addressBook: AddressBook;
    readonly orderbookFactory: OrderbookFactoryV1;
}

export type OrderbookFactoryScenarioProperties<TestContext extends OrderbookFactoryContext> = TestScenarioProperties<TestContext>;

export abstract class OrderbookFactoryScenario<TestContext extends OrderbookFactoryContext, ExecuteResult, ExecuteStaticResult>
    extends TestScenario<TestContext, ExecuteResult, ExecuteStaticResult>
{
    constructor({
        ...rest
    }: OrderbookFactoryScenarioProperties<TestContext>) {
        super(rest);
    }

    addContext(addContext: AddContextFunction): void {
        super.addContext(addContext);
    }

    protected async _setup(): Promise<OrderbookFactoryContext> {
        const ctx = await super._setup();
        const addressBook = await AddressBook.deploy();
        const orderbookFactory = await OrderbookFactoryV1.deploy(addressBook);
        return { ...ctx, addressBook, orderbookFactory };
    }
}
