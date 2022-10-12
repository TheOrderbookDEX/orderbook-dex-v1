import { AddContextFunction, BaseTestContext, TestScenario, TestScenarioProperties } from '@frugal-wizard/contract-test-helper';
import { OrderbookV1 } from '../../src/OrderbookV1';
import { ERC20Mock } from '@theorderbookdex/orderbook-dex/dist/testing/ERC20Mock';
import { AddressBook } from '@frugal-wizard/addressbook/dist/AddressBook';
import { formatValue, parseValue } from '@frugal-wizard/abi2ts-lib';

export interface DeployOrderbookContext extends BaseTestContext {
    readonly addressBook: AddressBook;
    readonly tradedToken: ERC20Mock;
    readonly baseToken: ERC20Mock;
}

export interface DeployOrderbookScenarioProperties extends TestScenarioProperties<BaseTestContext> {
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize?: bigint;
    readonly priceTick?: bigint;
}

export class DeployOrderbookScenario extends TestScenario<DeployOrderbookContext, OrderbookV1, string> {
    readonly addressBookAddress?: string;
    readonly tradedTokenAddress?: string;
    readonly baseTokenAddress?: string;
    readonly contractSize: bigint;
    readonly priceTick: bigint;

    constructor({
        addressBookAddress,
        tradedTokenAddress,
        baseTokenAddress,
        contractSize = parseValue(10),
        priceTick = parseValue(1),
        ...rest
    }: DeployOrderbookScenarioProperties) {
        super(rest);
        this.addressBookAddress = addressBookAddress;
        this.tradedTokenAddress = tradedTokenAddress;
        this.baseTokenAddress = baseTokenAddress;
        this.contractSize = contractSize;
        this.priceTick = priceTick;
    }

    addContext(addContext: AddContextFunction): void {
        if (this.addressBookAddress) {
            addContext('address book address', this.addressBookAddress);
        }
        if (this.tradedTokenAddress) {
            addContext('traded token address', this.tradedTokenAddress);
        }
        if (this.baseTokenAddress) {
            addContext('base token address', this.baseTokenAddress);
        }
        addContext('contractSize', formatValue(this.contractSize));
        addContext('priceTick', formatValue(this.priceTick));
        super.addContext(addContext);
    }

    protected async _setup(): Promise<DeployOrderbookContext> {
        const ctx = await super._setup();
        const addressBook = this.addressBookAddress ?
            AddressBook.at(this.addressBookAddress) :
            await AddressBook.deploy();
        const tradedToken = this.tradedTokenAddress ?
            ERC20Mock.at(this.tradedTokenAddress) :
            await ERC20Mock.deploy('Traded Token', 'TRADED', 18);
        const baseToken = this.baseTokenAddress ?
            ERC20Mock.at(this.baseTokenAddress) :
            await ERC20Mock.deploy('Base Token', 'BASE', 18);
        return { ...ctx, addressBook, tradedToken, baseToken };
    }

    async setup() {
        return await this._setup();
    }

    async execute({ addressBook, tradedToken, baseToken }: DeployOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await OrderbookV1.deploy(addressBook, tradedToken, baseToken, contractSize, priceTick);
    }

    async executeStatic({ addressBook, tradedToken, baseToken }: DeployOrderbookContext) {
        const { contractSize, priceTick } = this;
        return await OrderbookV1.callStatic.deploy(addressBook, tradedToken, baseToken, contractSize, priceTick);
    }
}
