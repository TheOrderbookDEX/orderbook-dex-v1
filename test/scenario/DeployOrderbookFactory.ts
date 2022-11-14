import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';

export interface DeployOrderbookFactoryContext extends BaseTestContext {
    readonly addressBook: AddressBook;
}

export interface DeployOrderbookFactoryScenarioProperties extends TestScenarioProperties<BaseTestContext> {
    readonly addressBookAddress?: string;
}

export class DeployOrderbookFactoryScenario extends TestScenario<DeployOrderbookFactoryContext, OrderbookFactoryV1, string> {
    readonly addressBookAddress?: string;

    constructor({
        addressBookAddress,
        ...rest
    }: DeployOrderbookFactoryScenarioProperties) {
        super(rest);
        this.addressBookAddress = addressBookAddress;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.addressBookAddress) {
            addContext('address book address', this.addressBookAddress);
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<DeployOrderbookFactoryContext> {
        const ctx = await super._setup();
        const addressBook = this.addressBookAddress ?
            AddressBook.at(this.addressBookAddress) :
            await AddressBook.deploy();
        return { ...ctx, addressBook };
    }

    async setup() {
        return await this._setup();
    }

    async execute({ addressBook }: DeployOrderbookFactoryContext) {
        return await OrderbookFactoryV1.deploy(addressBook);
    }

    async executeStatic({ addressBook }: DeployOrderbookFactoryContext) {
        return await OrderbookFactoryV1.callStatic.deploy(addressBook);
    }
}
