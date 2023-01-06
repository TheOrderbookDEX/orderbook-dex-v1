import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { OrderbookFactoryV1 } from '../../src/OrderbookFactoryV1';
import { OrderbookDEXTeamTreasuryMock } from '@theorderbookdex/orderbook-dex/dist/testing/OrderbookDEXTeamTreasuryMock';
import { formatValue } from '@frugal-wizard/abi2ts-lib';

export interface DeployOrderbookFactoryContext extends BaseTestContext {
    readonly treasury: OrderbookDEXTeamTreasuryMock;
    readonly addressBook: AddressBook;
}

export interface DeployOrderbookFactoryScenarioProperties extends TestScenarioProperties<BaseTestContext> {
    readonly fee?: bigint;
    readonly addressBookAddress?: string;
}

export class DeployOrderbookFactoryScenario extends TestScenario<DeployOrderbookFactoryContext, OrderbookFactoryV1, string> {
    readonly fee: bigint;
    readonly addressBookAddress?: string;

    constructor({
        fee = 0n,
        addressBookAddress,
        ...rest
    }: DeployOrderbookFactoryScenarioProperties) {
        super(rest);
        this.fee = fee;
        this.addressBookAddress = addressBookAddress;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.fee) {
            addContext('fee', formatValue(this.fee));
        }
        if (this.addressBookAddress) {
            addContext('address book address', this.addressBookAddress);
        }
        super.addContext(addContext);
    }

    protected async _setup(): Promise<DeployOrderbookFactoryContext> {
        const ctx = await super._setup();
        const treasury = await OrderbookDEXTeamTreasuryMock.deploy(this.fee);
        const addressBook = this.addressBookAddress ?
            AddressBook.at(this.addressBookAddress) :
            await AddressBook.deploy();
        return { ...ctx, treasury, addressBook };
    }

    async setup() {
        return await this._setup();
    }

    async execute({ treasury, addressBook }: DeployOrderbookFactoryContext) {
        return await OrderbookFactoryV1.deploy(treasury, addressBook);
    }

    async executeStatic({ treasury, addressBook }: DeployOrderbookFactoryContext) {
        return await OrderbookFactoryV1.callStatic.deploy(treasury, addressBook);
    }
}
